#!/usr/bin/python
import os
import urllib2
import websocket
import thread
import time
import json
import sys
import serial
import struct

class Sensor:
	ID	  = 0
	UUID  = 0
	Type  = 0
	Value = 0
	UpdateInterval = 5
	
	def __init__(self, id, type, local_id):
		self.ID   = local_id
		self.UUID = id
		self.Type = type
	
	def SetInterval(self, interval):
		self.UpdateInterval = interval

class Adaptor:
	def Initiate (self):
		print("Adptor Class :: Initiate")

	__Initiate = Initiate

class USBAdaptor (Adaptor):
	UsbPath = ""
	Interfaces = ""
	SerialAdapter = ""

	def __init__(self):
		self.UsbPath 						  = "/dev/"
		self.DataArrived 					  = False;
		self.RXData 						  = ""
		self.OnSerialConnectedCallback 		  = None
		self.OnSerialDataArrivedCallback 	  = None
		self.OnSerialErrorCallback 			  = None
		self.OnSerialConnectionClosedCallback = None

		self.Initiate()

	def Initiate (self):
		dev = os.listdir(self.UsbPath)
		self.Interfaces = [item for item in dev if "ttyUSB" in item]
		print self.Interfaces

	def ConnectDevice(self, id):
		self.SerialAdapter = serial.Serial(port=self.UsbPath+self.Interfaces[id-1], baudrate=9600, parity=serial.PARITY_ODD, stopbits=serial.STOPBITS_TWO, bytesize=serial.SEVENBITS)
		if self.SerialAdapter != "":
			thread.start_new_thread(self.RecievePacketsWorker, ())
			return True
		
		return False

	def Send (self, data):
		self.DataArrived = False
		self.SerialAdapter.write(str(data) + '\n')
		while self.DataArrived == False:
			time.sleep(0.1)
		return self.RXData

	def RecievePacketsWorker (self):
		while True:
			print "Data Arrived"
			self.RXData = self.SerialAdapter.readline()
			self.DataArrived = True
			print ":".join("{:02x}".format(ord(c)) for c in self.RXData)

class MkSProtocol ():
	def SetConfigurationRegisterCommand (self):
		return struct.pack("BBHBB", 0xDE, 0xAD, 0x2, 0x1, 0xF)

	def GetConfigurationRegisterCommand (self):
		return struct.pack("BBH", 0xDE, 0xAD, 0x1)

	def SetBasicSensorValueCommand (self, id, value):
		return struct.pack("BBHBBH", 0xDE, 0xAD, 0x101, 0x3, id, value)

	def SetArduinoNanoUSBSensorValueCommand (self, id, value):
		return struct.pack("BBHBBH", 0xDE, 0xAD, 0x101, 0x3, int(id), int(value))

	def GetArduinoNanoUSBSensorValueCommand (self, id):
		return struct.pack("BBHBBH", 0xDE, 0xAD, 0x100, 0x3, int(id), 0x0)

	def GetDeviceUUIDCommand (self):
		return struct.pack("BBH", 0xDE, 0xAD, 0x51)

	def GetDeviceTypeCommand (self):
		return struct.pack("BBH", 0xDE, 0xAD, 0x50)

class MkSArduinoSensor ():
	def __init__ (self, adaptor, protocol):
		self.Adaptor  = adaptor
		self.Protocol = protocol

	def Connect (self):
		idx = 1
		for item in self.Adaptor.Interfaces:
			isConnected = self.Adaptor.ConnectDevice(idx)
			if isConnected == True:
				txPacket = self.Protocol.GetDeviceTypeCommand()
				rxPacket = self.Adaptor.Send(txPacket)
				magic_one, magic_two, op_code, content_length = struct.unpack("BBHB", rxPacket[0:5])
				deviceType = rxPacket[5:]
				return True
			idx = idx + 1

		return False

	def GetUUID (self):
		txPacket = self.Protocol.GetDeviceUUIDCommand()
		rxPacket = self.Adaptor.Send(txPacket)
		return rxPacket[5:]

	def SetSensor (self, id, value):
		txPacket = self.Protocol.SetArduinoNanoUSBSensorValueCommand(id, value)
		rxPacket = self.Adaptor.Send(txPacket)
		return rxPacket

	def GetSensor (self, id):
		txPacket = self.Protocol.GetArduinoNanoUSBSensorValueCommand(id)
		rxPacket = self.Adaptor.Send(txPacket)
		return rxPacket

class MkSNetMachine ():
	def __init__(self, uri, wsuri):
		self.Name 		  = "Communication to Node.JS"
		self.ServerUri 	  = uri
		self.WSServerUri  = wsuri
		self.UserName 	  = ""
		self.Password 	  = ""
		self.UserDevKey   = ""
		self.WSConnection = None
		self.DeviceUUID   = ""
		self.Type 		  = 0

		self.OnConnectionCallback 		= None
		self.OnDataArrivedCallback 		= None
		self.OnErrorCallback 			= None
		self.OnConnectionClosedCallback = None

	def GetRequest (self, url):
		return urllib2.urlopen(url).read()

	def Authenticate (self, username, password):
		data 	 = self.GetRequest(self.ServerUri + "fastlogin/" + self.UserName + "/" + self.Password)
		jsonData = json.loads(data)

		if ('error' in jsonData):
			return False
		else:
			self.UserDevKey = jsonData['key']
			return True

	def InsertBasicSesnor (self, sensor):
		data 	 = self.GetRequest(self.ServerUri + "insert/sensor/basic/" + self.UserDevKey + "/" + self.DeviceUUID + "/" + sensor.UUID + "/" + str(sensor.Type) + "/" + str(sensor.Value));
		jsonData = json.loads(data)

	def WSConnection_OnMessage_Handler (self, ws, message):
		print message
		data = json.loads(message)
		self.OnDataArrivedCallback(data)

	def WSConnection_OnError_Handler (self, ws, error):
	    print error

	def WSConnection_OnClose_Handler (self, ws):
	    print "Connection closed ..."
	    sys.exit()
		
	def WSConnection_OnOpen_Handler (self, ws):
		print "Connection to server established ..."
		self.OnConnectionCallback()
		#SaveState()

	def WSWorker (self):
		self.WSConnection.run_forever()

	def Connect (self, username, password):
		self.UserName = username
		self.Password = password

		# TODO - Add retry counter.
		ret = self.Authenticate(username, password)
		if ret == True:
			websocket.enableTrace(False)
			self.WSConnection 				= websocket.WebSocketApp(self.WSServerUri)
			self.WSConnection.on_message 	= self.WSConnection_OnMessage_Handler
			self.WSConnection.on_error 		= self.WSConnection_OnError_Handler
			self.WSConnection.on_close 		= self.WSConnection_OnClose_Handler
			self.WSConnection.on_open 		= self.WSConnection_OnOpen_Handler
			self.WSConnection.header		= {'uuid':self.DeviceUUID}
			thread.start_new_thread(self.WSWorker, ())
			return True

		return False

	def SetDeviceUUID (self, uuid):
		self.DeviceUUID = uuid;

	def SetDeviceType (self, type):
		self.Type = type;

	def SendWebSocket(self, payload):
		self.WSConnection.send(payload)

	def BuildJSONFromBasicSensorList (self, sensors):
		payload = "{\"key\":\"" + str(self.UserDevKey) + "\",\"device\":{\"uuid\":\"" + str(self.DeviceUUID) + "\",\"type\":" + str(self.Type) + "},\"sensors\":["
		for item in sensors:
			payload += "{\"uuid\":\"" + str(item.UUID) + "\",\"type\":" + str(item.Type) + ",\"value\":" + str(item.Value) + ", \"update_ts\":5},"
		payload = payload[:-1]
		payload += "]}"
		return payload

	def GetUUIDFromJson(self, json):
		return json['uuid']

	def GetValueFromJson(self, json):
		return json['value']

class MkSThisMachine ():
	def __init__ (self, device, network):
		self.Sensors 	= []
		self.Device 	= device
		self.Network	= network
		self.Type 		= 1000
		self.UUID 		= "ac6de837-7863-72a9-c789-b0aae7e9d93e"
		self.OSType 	= "Linux"
		self.OSVersion 	= "Unknown"
		self.BrandName 	= "MakeSense-Virtual"
		self.State 		= 'IDLE'
		self.Delay 		= 1;

		self.States = {
			'IDLE': 	self.IdleState,
			'ACCESS': 	self.GetAccessSatate,
			'PUBLISH': 	self.PublishSensorState,
			'UPDATE': 	self.UpdateSensorState
		}

		self.Network.SetDeviceUUID(self.UUID)
		self.Network.SetDeviceType(self.Type)
		self.Network.OnConnectionCallback  = self.WebSocketConnectedCallback
		self.Network.OnDataArrivedCallback = self.WebSocketDataArrivedCallback

	def WebSocketConnectedCallback (self):
		print "WebSocketConnectedCallback"
		if (len(self.Sensors) > 0):
			payload = self.Network.BuildJSONFromBasicSensorList(self.Sensors)
			self.Network.SendWebSocket(payload)

	def WebSocketDataArrivedCallback (self, json):
		print "WebSocketDataArrivedCallback"
		ret = self.UpdateSensor(json)
		if ret == True:
			payload = self.Network.BuildJSONFromBasicSensorList(self.Sensors)
			self.Network.SendWebSocket(payload)

	def AddSensor (self, sensor):
		self.Sensors.append(sensor)

	def UpdateSensor (self, sensorJSON):
		for item in self.Sensors:
			if item.UUID == self.Network.GetUUIDFromJson(sensorJSON):
				item.Value = self.Network.GetValueFromJson(sensorJSON)
				self.Device.SetSensor(item.ID, item.Value)
				return True
	
		return False

	def IdleState (self):
		print "IdleState"
		self.State = "ACCESS"

	def GetAccessSatate (self):
		print "GetAccessSatate"
		if self.Network.Connect("ykiveish", "1234") == True:
			self.State = "PUBLISH"

	def PublishSensorState (self):
		print "PublishSensorState"
		for item in self.Sensors:
			self.Network.InsertBasicSesnor (item)
		self.State = 'UPDATE'
		self.Delay = 10

	def UpdateSensorState (self):
		print "UpdateSensorState"
		for item in self.Sensors:
			data = self.Device.GetSensor(item.ID)
			MagicOne, MagicTwo, Opcode, Length, DeviceId, Value = struct.unpack("BBHBBH", data[0:8])
			item.Value = Value

		if (len(self.Sensors) > 0):
			payload = self.Network.BuildJSONFromBasicSensorList(self.Sensors)
			self.Network.SendWebSocket(payload)
		
	def MachineStateWorker (self):
		while True:
			self.Method = self.States[self.State]
			self.Method()
			time.sleep(self.Delay)

	def Run (self):
		thread.start_new_thread(self.MachineStateWorker, ())
		while True:
			time.sleep(5)

prot 		= MkSProtocol()
connector 	= USBAdaptor()
device 	  	= MkSArduinoSensor(connector, prot)
network 	= MkSNetMachine("http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com/", "ws://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8181/")
machine		= MkSThisMachine(device, network)

def main():
	machine.AddSensor(Sensor("ac6de837-7863-72a9-c789-a0aae7e9d931", 1, 1))
	machine.AddSensor(Sensor("ac6de837-7863-72a9-c789-a0aae7e9d932", 2, 2))
	machine.AddSensor(Sensor("ac6de837-7863-72a9-c789-a0aae7e9d933", 4, 3))

	ret = device.Connect()
	if ret == False:
		return 1

	print "Device Found ..."
	ret = device.GetUUID()
	print ret

	machine.Run()

if __name__ == "__main__":
    main()

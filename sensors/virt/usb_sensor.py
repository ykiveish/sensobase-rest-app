#!/usr/bin/python
import os
import thread
import time
import sys
import json
import signal

from mksdk import MkSDevice
from mksdk import MkSSensor
from mksdk import MkSUSBAdaptor
from mksdk import MkSProtocol
from mksdk import MkSArduinoSensor
from mksdk import MkSNetMachine
from mksdk import MkSFile

class MkSThisMachine ():
	def __init__ (self):
		self.ApiUrl 		= ""
		self.WsUrl			= ""
		self.UserName 		= ""
		self.Password 		= ""
		self.Sensors 		= []
		self.Protocol		= MkSProtocol.Protocol()
		self.Connector 		= MkSUSBAdaptor.Adaptor()
		self.Device 		= MkSArduinoSensor.ArduinoSensor(self.Connector, self.Protocol)
		self.Network		= MkSNetMachine.Network(self.ApiUrl, self.WsUrl)
		self.File 			= MkSFile.File()
		self.Type 			= 1000
		self.UUID 			= "ac6de837-7863-72a9-c789-b0aae7e9d93e"
		self.OSType 		= "Linux"
		self.OSVersion 		= "Unknown"
		self.BrandName 		= "MakeSense-Virtual"
		self.State 			= 'IDLE'
		self.Delay 			= 1
		self.UpdateInterval	= 10
		self.UpdateOnChange = False
		self.IsRunnig 		= True;

		self.States = {
			'IDLE': 	self.IdleState,
			'ACCESS': 	self.GetAccessState,
			'PUBLISH': 	self.PublishSensorState,
			'UPDATE': 	self.UpdateSensorState
		}

		self.Network.SetDeviceType(self.Type)
		self.Network.OnConnectionCallback  		= self.WebSocketConnectedCallback
		self.Network.OnDataArrivedCallback 		= self.WebSocketDataArrivedCallback
		self.Network.OnConnectionClosedCallback = self.WebSocketConnectionClosedCallback
		self.Network.OnErrorCallback 			= self.WebSocketErrorCallback

		self.DeviceInfo = MkSDevice.Device(self.UUID, self.Type, self.OSType, self.OSVersion, self.BrandName)
		self.AddSensor(MkSSensor.Sensor(self.UUID, 1, 1))
		self.AddSensor(MkSSensor.Sensor(self.UUID, 2, 2))
		self.AddSensor(MkSSensor.Sensor(self.UUID, 4, 3))

	def WebSocketConnectedCallback (self):
		print "WebSocketConnectedCallback"
		self.Network.UpdateSensorsWS(self.Sensors)

	def WebSocketDataArrivedCallback (self, json):
		request = self.Network.GetRequestFromJson(json)
		if request == "set_sensor":
			data = self.Network.GetDataFromJson(json)
			ret = self.UpdateSensor(data)
			if ret == True:
				self.Network.UpdateSensorsWS(self.Sensors)
		elif request == "direct":
			reqPayload = self.Network.GetPayloadFromJson(json)
			reqCommand = self.Network.GetCommandFromJson(json)
			self.DirectRequestHandler(reqCommand, reqPayload)
		else:
			print "Error: Not support " + request + " request type."

	def WebSocketConnectionClosedCallback (self):
		print "WebSocketConnectionClosedCallback"
		self.State = "ACCESS"

	def WebSocketErrorCallback (self):
		print "WebSocketErrorCallback"

	def AddSensor (self, sensor):
		self.Sensors.append(sensor)

	def UpdateSensor (self, sensorJSON):
		for item in self.Sensors:
			if item.UUID == self.Network.GetUUIDFromJson(sensorJSON):
				item.Value = self.Network.GetValueFromJson(sensorJSON)
				self.Device.SetSensor(item.ID, item.Value)
				return True
	
		return False
	
	def SetUpdateInterval (self):
		self.Delay = self.UpdateInterval

	def DirectRequestHandler (self, command, payload):
		if command == "get_device_config":
			resPayload = "{\"response\":\"direct\",\"data\":{\"key\":\"" + str(self.Network.UserDevKey) + "\",\"device\":{\"uuid\":\"" + str(self.UUID) + "\",\"type\":" + str(self.Type) + ",\"cmd\":\"get_update_period\"},\"payload\":{\"interval\":" + str(self.UpdateInterval) + ",\"update_on_change\":\"" + str(self.UpdateOnChange) + "\"}}}"
			self.Network.Response(resPayload)
		elif command == "set_device_config":
			self.UpdateInterval = int(payload['interval'])
			self.SetUpdateInterval()
			self.UpdateOnChange = payload['update_on_change']
			resPayload = "{\"response\":\"direct\",\"data\":{\"key\":\"" + str(self.Network.UserDevKey) + "\",\"device\":{\"uuid\":\"" + str(self.UUID) + "\",\"type\":" + str(self.Type) + ",\"cmd\":\"get_update_period\"},\"payload\":{\"interval\":" + str(self.UpdateInterval) + ",\"update_on_change\":\"" + str(self.UpdateOnChange) + "\"}}}"
			self.Network.Response(resPayload)
		else:
			print "Error: Not support " + command + " command."

	def IdleState (self):
		print "IdleState"
		jsonSystemStr = self.File.LoadStateFromFile("system.json")
		jsonSensorStr = self.File.LoadStateFromFile("data.json")
		
		try:
			dataSystem = json.loads(jsonSystemStr)
		except:
			print "Error: system.json incorrect"
			self.Exit()
		
		self.ApiUrl 	= dataSystem["apiurl"]
		self.WsUrl		= dataSystem["wsurl"]
		self.UserName 	= dataSystem["username"]
		self.Password 	= dataSystem["password"]
		
		self.Network.SetApiUrl(self.ApiUrl)
		self.Network.SetWsUrl(self.WsUrl)
		
		self.Type 		= dataSystem["device"]["type"]
		self.UUID 		= dataSystem["device"]["uuid"]
		self.OSType 	= dataSystem["device"]["ostype"]
		self.OSVersion 	= dataSystem["device"]["osversion"]
		self.BrandName 	= dataSystem["device"]["brandname"]
		
		if jsonSensorStr != "":
			# Convert to Json.
			data = json.loads(jsonSensorStr)
			# Itterate over sensors and update local storage. 
			for sensor in data["sensors"]:
				ret = self.UpdateSensor(sensor)
			print "Device state loaded ..."
	
		self.State = "ACCESS"

	def GetAccessState (self):
		print "Get Access ..."
		if self.Network.Connect(self.UserName, self.Password) == True:
			print "Publish Device ..."
			data, error = self.Network.InsertDevice(self.DeviceInfo)
			if error == False:
				return
			self.State = "PUBLISH"

	def PublishSensorState (self):
		print "PublishSensorState"
		for item in self.Sensors:
			data, error = self.Network.InsertBasicSesnor(item)
			if error == False:
				return
		self.State = 'UPDATE'
		self.Delay = self.UpdateInterval
		self.Network.UpdateSensorsWS(self.Sensors)

	def UpdateSensorState (self):
		print "UpdateSensorState"
		for item in self.Sensors:
			DeviceId, Value = self.Device.GetSensor(item.ID)
			item.Value = Value

		self.File.SaveStateToFile("data.json", self.Network.BuildJSONFromBasicSensorList(self.Sensors))
		ret = self.Network.UpdateSensorsWS(self.Sensors)
		
		# If device failed to update WS we need to try access server again
		if ret == False:
			self.State = "ACCESS"
		
	def MachineStateWorker (self):
		while self.IsRunnig:
			self.Method = self.States[self.State]
			self.Method()
			time.sleep(self.Delay)

	def Run (self):
		ret = self.Device.Connect()
		if ret == False:
			return 1

		self.UUID = self.Device.GetUUID()
		self.Network.SetDeviceUUID(self.UUID)
		thread.start_new_thread(self.MachineStateWorker, ())
		while self.IsRunnig:
			time.sleep(5)

		self.Connector.DisconnectDevice()
		sys.exit(1);
	
	def Exit (self):
		self.IsRunnig = False		

machine = MkSThisMachine()
def signal_handler(signal, frame):
	machine.Exit()
	
def main():
	signal.signal(signal.SIGINT, signal_handler)
	machine.Run()

if __name__ == "__main__":
    main()

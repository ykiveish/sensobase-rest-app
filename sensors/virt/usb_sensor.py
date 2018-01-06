#!/usr/bin/python
import os
import thread
import time
import sys
import json
import signal
import sqlite3 as lite

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
		self.DBCon			= None
		self.DBCur			= None
		self.Type 			= 1000
		self.UUID 			= "ac6de837-7863-72a9-c789-b0aae7e9d93e"
		self.OSType 		= "Linux"
		self.OSVersion 		= "Unknown"
		self.BrandName 		= "MakeSense-Virtual"
		self.State 			= 'IDLE'
		self.Delay 			= 1
		self.UpdateInterval	= 10
		self.UpdateOnChange = "False"
		self.UpdateLocalDB	= "False"
		self.IsRunnig 		= True;

		self.States = {
			'IDLE': 	self.IdleState,
			'ACCESS': 	self.GetAccessState,
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
		if request == "direct":
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

	def SetSensorName (self, uuid, name):
		for sensor in self.Sensors:
			if sensor.UUID == uuid:
				sensor.Name = name
				return True

		return False

	def UpdateSensor (self, uuid, value):
		for sensor in self.Sensors:
			if sensor.UUID == uuid:
				if self.UpdateLocalDB == "True":
					if sensor.Value != value:
						self.File.AppendToFile(sensor.UUID + ".json", "{\"ts\":" + str(time.time()) + ",\"v\":" + value + "},\n")
						print "Saving to file ..."
				sensor.Value = value
				self.Device.SetSensor(sensor.ID, sensor.Value)
				return True

		return False

	def SetUpdateInterval (self):
		self.Delay = self.UpdateInterval

	def DirectRequestHandler (self, command, payload):
		if command == "get_device_config":
			resPayload = "{\"response\":\"direct\",\"data\":{\"key\":\"" + str(self.Network.UserDevKey) + "\",\"device\":{\"uuid\":\"" + str(self.UUID) + "\",\"type\":" + str(self.Type) + ",\"cmd\":\"get_device_config\"},\"payload\":{\"interval\":" + str(self.UpdateInterval) + ",\"update_on_change\":\"" + self.UpdateOnChange + "\",\"update_local_db\":\"" + self.UpdateLocalDB + "\"}}}"
			self.Network.Response(resPayload)
		elif command == "set_device_config":
			self.UpdateInterval = int(payload['interval'])
			self.UpdateOnChange = payload['update_on_change']
			self.UpdateLocalDB  = payload['update_local_db']
			self.File.SaveStateToFile("config.json", "{\"device\":{\"update_interval\":" + str(self.UpdateInterval) + ",\"update_on_change\":\"" + self.UpdateOnChange + "\",\"update_local_db\":\"" + self.UpdateLocalDB + "\"}}")
			self.SetUpdateInterval()
			resPayload = "{\"response\":\"direct\",\"data\":{\"key\":\"" + str(self.Network.UserDevKey) + "\",\"device\":{\"uuid\":\"" + str(self.UUID) + "\",\"type\":" + str(self.Type) + ",\"cmd\":\"set_device_config\"},\"payload\":{\"interval\":" + str(self.UpdateInterval) + ",\"update_on_change\":\"" + sself.UpdateOnChange + "\",\"update_local_db\":\"" + self.UpdateLocalDB + "\"}}}"
			self.Network.Response(resPayload)
		elif command == "get_device_sensors":
			self.SendDirectCommand_UpdateSensors()
		elif command == "set_device_sensors":
			sensors = payload['sensors']
			if len(sensors) > 0:
				for sensor in sensors:
					self.UpdateSensor(sensor['uuid'], sensor['value'])
				self.SendDirectCommand_UpdateSensors()
		else:
			print "Error: Not support " + command + " command."

	def SendDirectCommand_UpdateSensors(self):
		resPayload = "\"sensors\":["
		for item in self.Sensors:
			resPayload += "{\"uuid\":\"" + str(item.UUID) + "\",\"type\":" + str(item.Type) + ",\"name\":\"" + item.Name + "\",\"value\":" + str(item.Value) + "},"
		resPayload = resPayload[:-1] + "]"
		dataToWeb = self.Network.BuildDirectResponse("set_device_sensors", resPayload)
		return self.Network.Response(dataToWeb)

	def ReadAllSensors (self):
		for item in self.Sensors:
			DeviceId, Value = self.Device.GetSensor(item.ID)
			item.Value = Value

	def IdleState (self):
		print "IdleState"
		jsonSystemStr = self.File.LoadStateFromFile("system.json")
		jsonConfigStr = self.File.LoadStateFromFile("config.json")
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

		if jsonConfigStr != "":
			# Convert to Json.
			dataConfig = json.loads(jsonConfigStr)
			self.UpdateInterval = dataConfig["device"]["update_interval"]
			self.UpdateOnChange = dataConfig["device"]["update_on_change"]
			self.UpdateLocalDB  = dataConfig["device"]["update_local_db"]

		self.ReadAllSensors()
		if jsonSensorStr != "":
			data = json.loads(jsonSensorStr) 
			for sensor in data["sensors"]:
				self.SetSensorName(sensor['uuid'], sensor['name'])
			print "Device state loaded ..."

		self.State = "ACCESS"

	def GetAccessState (self):
		print "Get Access ..."
		if self.Network.Connect(self.UserName, self.Password) == True:
			print "Publish Device ..."
			data, error = self.Network.InsertDevice(self.DeviceInfo)
			if error == False:
				return

			self.SendDirectCommand_UpdateSensors()
			self.Delay = self.UpdateInterval
			self.State = "UPDATE"

	def UpdateSensorState (self):
		print "UpdateSensorState"
		DoUpdate = False
		for item in self.Sensors:
			DeviceId, Value = self.Device.GetSensor(item.ID)
			if self.UpdateLocalDB == "True":
				if item.Value != Value:
					print "Saving to file ..."
					self.File.AppendToFile(item.UUID + ".json", "{\"ts\":" + str(time.time()) + ",\"v\":" + str(Value) + "},\n")
			if self.UpdateOnChange == "True":
				if item.Value != Value:
					DoUpdate = True
			else:
				DoUpdate = True

			if DoUpdate == True:
				item.Value = Value
				if False == self.SendDirectCommand_UpdateSensors():
					self.State = "ACCESS"

	def Run (self):
		ret = self.Device.Connect()
		if ret == False:
			return 1

		self.UUID = self.Device.GetUUID()
		self.Network.SetDeviceUUID(self.UUID)
		while self.IsRunnig:
			self.Method = self.States[self.State]
			self.Method()
			if self.UpdateOnChange == "True":
				time.sleep(10)
			else:
				time.sleep(self.Delay)

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


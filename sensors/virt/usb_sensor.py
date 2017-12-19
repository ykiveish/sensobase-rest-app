#!/usr/bin/python
import os
import thread
import time
import sys

import MkSSensor
import MkSUSBAdaptor
import MkSProtocol
import MkSArduinoSensor
import MkSNetMachine

class MkSThisMachine ():
	def __init__ (self):
		self.ApiUrl 	= "http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com/"
		self.WsUrl		= "ws://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8181/"
		self.UserName 	= "ykiveish"
		self.Password 	= "1234"
		self.Sensors 	= []
		self.Protocol	= MkSProtocol.Protocol()
		self.Connector 	= MkSUSBAdaptor.Adaptor()
		self.Device 	= MkSArduinoSensor.ArduinoSensor(self.Connector, self.Protocol)
		self.Network	= MkSNetMachine.Network(self.ApiUrl, self.WsUrl)
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

		self.Network.SetDeviceType(self.Type)
		self.Network.OnConnectionCallback  = self.WebSocketConnectedCallback
		self.Network.OnDataArrivedCallback = self.WebSocketDataArrivedCallback

		self.AddSensor(MkSSensor.Sensor(self.UUID, 1, 1))
		self.AddSensor(MkSSensor.Sensor(self.UUID, 2, 2))
		self.AddSensor(MkSSensor.Sensor(self.UUID, 4, 3))

	def WebSocketConnectedCallback (self):
		print "WebSocketConnectedCallback"
		self.Network.UpdateSensorsWS(self.Sensors)

	def WebSocketDataArrivedCallback (self, json):
		print "WebSocketDataArrivedCallback"
		ret = self.UpdateSensor(json)
		if ret == True:
			self.Network.UpdateSensorsWS(self.Sensors)

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
		if self.Network.Connect(self.UserName, self.Password) == True:
			self.State = "PUBLISH"

	def PublishSensorState (self):
		print "PublishSensorState"
		for item in self.Sensors:
			datam, error = self.Network.InsertBasicSesnor(item)
			if error == False:
				return
		self.State = 'UPDATE'

	def UpdateSensorState (self):
		print "UpdateSensorState"
		for item in self.Sensors:
			DeviceId, Value = self.Device.GetSensor(item.ID)
			item.Value = Value

		self.Network.UpdateSensorsWS(self.Sensors)
		self.Delay = 10
		
	def MachineStateWorker (self):
		while True:
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
		while True:
			time.sleep(5)

		self.Connector.DisconnectDevice()

def main():
	machine = MkSThisMachine()
	machine.Run()

if __name__ == "__main__":
    main()

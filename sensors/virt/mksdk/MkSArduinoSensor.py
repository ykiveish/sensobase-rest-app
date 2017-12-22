#!/usr/bin/python
import os
import time
import struct

import MkSUSBAdaptor
import MkSProtocol

class ArduinoSensor ():
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
		return rxPacket[5:-1] # "-1" is for removing "\n" at the end (no unpack used)

	def SetSensor (self, id, value):
		txPacket = self.Protocol.SetArduinoNanoUSBSensorValueCommand(id, value)
		rxPacket = self.Adaptor.Send(txPacket)
		return rxPacket

	def GetSensor (self, id):
		txPacket = self.Protocol.GetArduinoNanoUSBSensorValueCommand(id)
		rxPacket = self.Adaptor.Send(txPacket)
		MagicOne, MagicTwo, Opcode, Length, DeviceId, Value = struct.unpack("BBHBBH", rxPacket[0:8])
		return DeviceId, Value

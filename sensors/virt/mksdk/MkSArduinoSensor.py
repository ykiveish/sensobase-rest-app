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
		deviceFound = False
		for item in self.Adaptor.Interfaces:
			isConnected = self.Adaptor.ConnectDevice(idx, 3)
			if isConnected == True:
				txPacket = self.Protocol.GetDeviceTypeCommand()
				rxPacket = self.Adaptor.Send(txPacket)
				if (len(rxPacket) > 5):
					magic_one, magic_two, op_code, content_length = struct.unpack("BBHB", rxPacket[0:5])
					if (magic_one == 0xde and magic_two == 0xad):
						deviceType = rxPacket[5:]
						deviceFound = True
						self.Adaptor.DisconnectDevice()
						break
					else:
						self.Adaptor.DisconnectDevice()
						print "Not a MakeSense complient device... "
				else:
					self.Adaptor.DisconnectDevice()
					print "Not a MakeSense complient device... "

			idx = idx + 1

		if deviceFound == True:
			isConnected = self.Adaptor.ConnectDevice(idx, 0)
			if isConnected == True:
				return True

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

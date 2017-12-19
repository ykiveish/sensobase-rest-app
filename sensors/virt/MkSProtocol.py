#!/usr/bin/python
import struct

class Protocol ():
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

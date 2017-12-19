#!/usr/bin/python
import os
import time
import sys
import serial
import struct
import thread

class Adaptor ():
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
	def DisconnectDevice (self):
		self.SerialAdapter.close()

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

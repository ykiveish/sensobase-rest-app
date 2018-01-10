#!/usr/bin/python
import os
import sys
import thread
import threading
import time
import json

from mksdk import MkSFile
from mksdk import MkSNetMachine

class Node():
	"""Node respomsable for coordinate between web services
	and adaptor (in most cases serial)"""
	   
	def __init__(self):
		# Objects node depend on
		self.File 				= MkSFile.File()
		self.Device 			= None
		self.Network			= None
		# Node connection to WS information
		self.ApiUrl 			= ""
		self.WsUrl				= ""
		self.UserName 			= ""
		self.Password 			= ""
		# Device information
		self.Type 				= 0
		self.UUID 				= ""
		self.IsHardwareBased 	= False
		self.OSType 			= ""
		self.OSVersion 			= ""
		self.BrandName 			= ""
		# Misc
		self.Sensors 			= []
		self.State 				= 'IDLE'
		self.IsRunnig 			= True
		self.AccessTick 		= 0
		# Inner state
		self.States = {
			'IDLE': 			self.StateIdle,
			'CONNECT_DEVICE':	self.StateConnectDevice,
			'ACCESS': 			self.StateGetAccess,
			'WORK': 			self.StateWork
		}
		# Callbacks
		self.WorkingCallback = None
		# Locks
		self.NetworkAccessTickLock = threading.Lock()
	
	def LoadSystemConfig(self):
		# Information about the node located here.
		jsonSystemStr = self.File.LoadStateFromFile("system.json")
		
		try:
			dataSystem 				= json.loads(jsonSystemStr)
			# Node connection to WS information
			self.ApiUrl 			= dataSystem["apiurl"]
			self.WsUrl				= dataSystem["wsurl"]
			self.UserName 			= dataSystem["username"]
			self.Password 			= dataSystem["password"]
			# Device information
			self.Type 				= dataSystem["device"]["type"]
			self.UUID 				= dataSystem["device"]["uuid"]
			self.OSType 			= dataSystem["device"]["ostype"]
			self.OSVersion 			= dataSystem["device"]["osversion"]
			self.BrandName 			= dataSystem["device"]["brandname"]
			if "True" == dataSystem["device"]["isHW"]:
				self.IsHardwareBased = True
		except:
			print "Error: [LoadSystemConfig] Wrong system.json format"
			self.Exit()
	
	def SetDevice(self, device):
		print "SetDevice"
		self.Device = device
		
	def SetNetwork(self):
		print "SetNetwork"
	
	def StateIdle (self):
		print "StateIdle"
	
	def StateConnectDevice (self):
		print "StateConnectDevice"
		if True == self.IsHardwareBased:
			if None == self.Device:
				print "Error: [Run] Device did not specified"
				self.Exit()
			
			if False == self.Device.Connect():
				print "Error: [Run] Could not connect device"
				self.Exit()
		self.State = "ACCESS"
	
	def StateGetAccess (self):
		print "StateGetAccess"
		# Let the state machine know that this state was entered.
		self.NetworkAccessTickLock.acquire()
		try:
			self.AccessTick = 1
		finally:
			self.NetworkAccessTickLock.release()		
		if self.Network.Connect(self.UserName, self.Password) == True:
			print "Publish Device ..."
			# TODO - Muste get a valid reponse.
	
	def StateWork (self):
		self.WorkingCallback()
	
	def WebSocketConnectedCallback (self):
		print "WebSocketConnectedCallback"
		self.State = "WORK"
		# TODO - Send callback "OnWSConnected"

	def WebSocketDataArrivedCallback (self, json):
		print "WebSocketDataArrivedCallback"
		self.State = "WORK"
		# TODO - Send callback "OnWSDataArrived"

	def WebSocketConnectionClosedCallback (self):
		print "WebSocketConnectionClosedCallback"
		# TODO - Send callback "OnWSConnectionClosed"
		self.NetworkAccessTickLock.acquire()
		try:
			self.AccessTick = 0
		finally:
			self.NetworkAccessTickLock.release()
		self.State = "ACCESS"

	def WebSocketErrorCallback (self):
		print "WebSocketErrorCallback"
		# TODO - Send callback "OnWSError"
		self.NetworkAccessTickLock.acquire()
		try:
			self.AccessTick = 0
		finally:
			self.NetworkAccessTickLock.release()
		self.State = "ACCESS"
	
	def Run (self, callback):
		# Read sytem configuration
		self.LoadSystemConfig()
		self.WorkingCallback = callback
		self.State = "CONNECT_DEVICE"
		
		self.Network = MkSNetMachine.Network(self.ApiUrl, self.WsUrl)
		self.Network.SetDeviceType(self.Type)
		self.Network.OnConnectionCallback  		= self.WebSocketConnectedCallback
		self.Network.OnDataArrivedCallback 		= self.WebSocketDataArrivedCallback
		self.Network.OnConnectionClosedCallback = self.WebSocketConnectionClosedCallback
		self.Network.OnErrorCallback 			= self.WebSocketErrorCallback
		
		while self.IsRunnig:
			time.sleep(0.5)
			# If state is accessing network and it ia only the first time.
			if self.State == "ACCESS" and self.AccessTick > 0:
				self.NetworkAccessTickLock.acquire()
				try:
					self.AccessTick = self.AccessTick + 1
				finally:
					self.NetworkAccessTickLock.release()
				if self.AccessTick < 10:
					print "Waiting for web service ... " + self.AccessTick
					continue
			
			self.Method = self.States[self.State]
			self.Method()
		
		self.Device.Disconnect()
	
	def Stop (self):
		print "Stop"
		self.IsRunnig = False
	
	def Pause (self):
		print "Pause"
	
	def Exit (self):
		print "Exit with ERROR"
		self.Stop()
		sys.exit(1);

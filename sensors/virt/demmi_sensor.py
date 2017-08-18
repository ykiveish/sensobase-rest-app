#!/usr/bin/python
import urllib2
import websocket
import thread
import time
import json

Counter = 1
TimerState = 0
State = 'IDLE'

UserDevKey = "ac6de837-7863-72a9-c789-a0aae7e9d93e"
UserName = "ykiveish"
Password = "1234"

Type 		= 1000
UUID 		= "ac6de837-7863-72a9-c789-b0aae7e9d93e"
OSType 		= "Linux"
OSVersion 	= "Unknown"
BrandName 	= "Demmi_Device"

WebSocketServer = "ws://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8181/"
RESTApiServer = "http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/"

class Sensor:
	UUID  = 0
	Type  = 0
	Value = 0
	
	def __init__(self, id, type):
		self.UUID = id
		self.Type = type
Sensors = []

def GetRequest (url):
	print url
	return urllib2.urlopen(url).read()
	
def on_message (ws, message):
    print message

def on_error (ws, error):
    print error

def on_close (ws):
    print "### closed ###"
	
def on_open (ws):
	print "### open ###"
	def worker (*args):
		global Counter
		print "Starting worker ..."
		while True:
			ws.send("{\"device\":98345,\"type\":999,\"sensors\":[{\"id\":5701,\"type\":1,\"value\":%d},{\"id\":5702,\"type\":4,\"value\":1},{\"id\":5703,\"type\":2,\"value\":50},{\"id\":5704,\"type\":3,\"value\":20},{\"id\":5705,\"type\":5,\"value\":99}]}" % Counter)
			time.sleep(3)
			Counter += 1
	thread.start_new_thread(worker, ())

def GetAccess ():
	data = GetRequest(RESTApiServer + "fastlogin/" + UserName + "/" + Password);
	jsonData = json.loads(data);
	
	global UserDevKey
	if ('error' in jsonData):
		return False;
	else:
		UserDevKey = jsonData['key']
		return True;

def InsertDevice ():
	global UserDevKey
	global Type
	global UUID
	global OSType
	global OSVersion
	global BrandName
	
	data = GetRequest(RESTApiServer + "insert/device/" + UserDevKey + "/" + str(Type) + "/" + UUID + "/" + OSType + "/" + OSVersion + "/" + BrandName);
	jsonData = json.loads(data)
	
	if ('info' in jsonData):
		return True;
	else:
		return False;

def InsertSesnor (sensor):
	data = GetRequest(RESTApiServer + "insert/sensor/basic/" + UserDevKey + "/" + UUID + "/" + sensor.UUID + "/" + str(sensor.Type) + "/" + str(sensor.Value));
	jsonData = json.loads(data)
	
def IdleState ():
	global TimerState
	global State
	print "IdleState %d" % TimerState
	
	if (TimerState % 3) == 0:
		State = "ACCESS"
	
	time.sleep(1)
	TimerState += 1

def GetAccessSatate ():
	global State
	print "GetAccessSatate"
	if True == GetAccess ():
		State = 'PUBLISH'
	else:
		State = 'IDLE'

# /insert/device/:key/:type/:uuid/:ostype/:osversion/:brandname 
def PublishSensorState ():
	global State
	print "PublishSensorState"
	
	InsertDevice()
	
	State = 'UPDATE'

def UpdateSensorState ():
	global State
	print "UpdateSensorState"
	websocket.enableTrace(True)
	ws = websocket.WebSocketApp(WebSocketServer)
	
	ws.on_message 	= on_message
	ws.on_error 	= on_error
	ws.on_close 	= on_close
	ws.on_open 		= on_open
	
	ws.run_forever()

States = {
'IDLE': 	IdleState,
'ACCESS': 	GetAccessSatate,
'PUBLISH': 	PublishSensorState,
'UPDATE': 	UpdateSensorState
}

def main():
	global Sesnors

	Sensors.append(Sensor("ac6de837-7863-72a9-c789-a0aae7e9d931", 1))
	Sensors.append(Sensor("ac6de837-7863-72a9-c789-a0aae7e9d932", 2))
	Sensors.append(Sensor("ac6de837-7863-72a9-c789-a0aae7e9d933", 3))
	Sensors.append(Sensor("ac6de837-7863-72a9-c789-a0aae7e9d934", 4))
	Sensors.append(Sensor("ac6de837-7863-72a9-c789-a0aae7e9d935", 5))
	
	for item in Sensors:
		InsertSesnor (item)
	
	#while True:
	#	Method = States[State]
	#	Method()
	#	time.sleep(1)
	
if __name__ == "__main__":
    main()

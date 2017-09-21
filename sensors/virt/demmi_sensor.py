#!/usr/bin/python
import urllib2
import websocket
import thread
import time
import json
import sys

Counter = 1 
TimerState = 0
State = 'IDLE'

UserDevKey = "ac6de837-7863-72a9-c789-a0aae7e9d935"
UserName = "ykiveish"
Password = "1234"

Type 		= 1000
UUID 		= "ac6de837-7863-72a9-c789-b0aae7e9d93e"
OSType 		= "Linux"
OSVersion 	= "Unknown"
BrandName 	= "MakeSense-Virtual"

WebSocketServer = "ws://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8181/"
RESTApiServer = "http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com/" 

class Sensor:
	UUID  = 0
	Type  = 0
	Value = 0
	UpdateInterval = 5
	
	def __init__(self, id, type):
		self.UUID = id
		self.Type = type
	
	def SetInterval(self, interval):
		self.UpdateInterval = interval
	
Sensors = []

def GetRequest (url):
	return urllib2.urlopen(url).read()

def BuildJsonString ():
	payload = "{\"key\":\"" + str(UserDevKey) + "\",\"device\":{\"uuid\":\"" + str(UUID) + "\",\"type\":" + str(Type) + "},\"sensors\":["
	for item in Sensors:
		if item.Type == 4:
			payload += "{\"uuid\":\"" + str(item.UUID) + "\",\"type\":" + str(item.Type) + ",\"value\":" + str(item.Value) + ", \"update_ts\":5},"
		else:
			payload += "{\"uuid\":\"" + str(item.UUID) + "\",\"type\":" + str(item.Type) + ",\"value\":" + str(Counter) + ", \"update_ts\":5},"
	payload = payload[:-1]
	payload += "]}"
	return payload

def UpdateSensorFromJson(json):
	for item in Sensors:
		if item.UUID == json['uuid']:
			item.Value = json['value']
			return True
	
	return False

def SaveState ():
	jsonStr = BuildJsonString ()
	file = open("system.json", "w")
	file.write(jsonStr)
	file.close()

def LoadState ():
	file = open("system.json", "r")
	jsonStr = file.read()
	file.close()
	
	# Convert to Json.
	data = json.loads(jsonStr)
	# Itterate over sensors and update local storage. 
	for sensor in data["sensors"]:
		UpdateSensorFromJson (sensor)
	print "Device state loaded ..."

# {"uuid":"sesnsor-uuid","value":value}
def on_message (ws, message):
	print message
	data = json.loads(message)
	UpdateSensorFromJson (data)

def on_error (ws, error):
    print error

def on_close (ws):
    print "Connection closed ..."
    sys.exit()
	
def on_open (ws):
	print "Connection to server established ..."
	def worker (*args):
		global Counter
		while True:
			ws.send(BuildJsonString())
			SaveState()
			time.sleep(5)
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
	
	if (TimerState % 3) == 0:
		State = "ACCESS"
	
	LoadState ()
	time.sleep(1)
	TimerState += 1

def GetAccessSatate ():
	global State
	print "GetAccessSatate"
	if True == GetAccess ():
		State = 'PUBLISH'
	else:
		State = 'IDLE'

def PublishSensorState ():
	global State
	print "PublishSensorState"
	
	for item in Sensors:
		InsertSesnor (item)

	State = 'UPDATE'

def UpdateSensorState ():
	global State
	print "UpdateSensorState"
	websocket.enableTrace(False)
	ws = websocket.WebSocketApp(WebSocketServer)
	
	ws.on_message 	= on_message
	ws.on_error 	= on_error
	ws.on_close 	= on_close
	ws.on_open 		= on_open
	ws.header		= {'uuid':UUID}
	
	ws.run_forever()

def LoadJson():
	retun

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
	
	while True:
		Method = States[State]
		Method()
		time.sleep(1)
	
if __name__ == "__main__":
    main()

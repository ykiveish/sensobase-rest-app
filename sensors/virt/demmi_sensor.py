#!/usr/bin/python
import urllib2
import websocket
import thread
import time

Counter = 1

def GetRquiest (url):
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
		print "Strting worker ..."
		while True:
			ws.send("{\"device\":98345,\"type\":999,\"sensors\":[{\"id\":5701,\"type\":1,\"value\":%d},{\"id\":5702,\"type\":4,\"value\":1},{\"id\":5703,\"type\":2,\"value\":50},{\"id\":5704,\"type\":3,\"value\":20},{\"id\":5705,\"type\":5,\"value\":99}]}" % Counter)
			time.sleep(3)
			Counter += 1
	thread.start_new_thread(worker, ())

def main():
	websocket.enableTrace(True)
	ws = websocket.WebSocketApp("ws://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8181/")
	
	ws.on_message 	= on_message
	ws.on_error 	= on_error
	ws.on_close 	= on_close
	ws.on_open 		= on_open
	
	ws.run_forever()
	
if __name__ == "__main__":
    main()
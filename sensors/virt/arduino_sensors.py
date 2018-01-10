#!/usr/bin/python
import os
import sys
import signal
import json

from mksdk import MkSUSBAdaptor
from mksdk import MkSProtocol
from mksdk import MkSConnectorArduino
from mksdk import MkSNode

Node = MkSNode.Node()
def signal_handler(signal, frame):
	Node.Stop()
	sys.exit(0)

def WorkingHandler():
	print "WorkingHandler" 

def main():
	signal.signal(signal.SIGINT, signal_handler)
	
	Device = MkSConnectorArduino.Connector(MkSUSBAdaptor.Adaptor(), MkSProtocol.Protocol())
	Node.SetDevice(Device)
	Node.Run(WorkingHandler)

if __name__ == "__main__":
    main()
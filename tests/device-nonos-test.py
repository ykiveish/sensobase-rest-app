import urllib2
import sys
import json
import os

Response = ""

os.system('clear')
Response = urllib2.urlopen("http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/nonos/insert/device/23e7797b-2a56-facb-ed46-6c61c4626698/10/23e7797b-2a56-facb-ed46-6c61c4626698/nodemcu/5.1.4").read()
if "security issue" not in Response:
  print "METHOD /nonos/insert/device ... SUCCESS [" + Response + "]"
else:
  print "METHOD select/users ... FAILED"
  sys.exit(0)

Response = urllib2.urlopen("http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/select/devices").read()
if "security issue" not in Response:
  print "METHOD /nonos/insert/device ... SUCCESS [" + Response + "]"
else:
  print "METHOD select/users ... FAILED"
  sys.exit(0)
  
Response = urllib2.urlopen("http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/delete/devices/ux0xhwyqocp").read()
if "security issue" not in Response:
  print "METHOD /nonos/insert/device ... SUCCESS [" + Response + "]"
else:
  print "METHOD select/users ... FAILED"
  sys.exit(0)
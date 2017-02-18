import urllib2
import sys

Response = ""

Response = urllib2.urlopen("http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/delete/users/ux0xhwyqocp").read()
if "security issue" not in Response:
  print "METHOD delete/users ... SUCCESS [" + Response + "]"
else:
  print "METHOD delete/users ... FAILED"
  sys.exit(0)
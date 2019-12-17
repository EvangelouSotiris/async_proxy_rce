import requests as r
import os
import subprocess
import json

master="apostolaras"
slave="sot-pc"

payload = {'slave_name': slave, 'master_name': master}
response = r.get('http://localhost:3000/slave_api', params=payload)

command = json.loads(response.content)[0].split(' ')
timestamp = json.loads(response.content)[1]

out = subprocess.check_output(command).decode('ascii')

payload_out = {'slave_name': slave, 'master_name':master , 'timestamp' : timestamp, 'out' : out}
r.post('http://localhost:3000/slave_api', params=payload_out)
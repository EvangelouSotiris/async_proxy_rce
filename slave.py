import requests as r

master="Iceowl"
slave="test_slave"

payload = {'slave_name': slave, 'master_name': master}
response = r.get('http://localhost:3000/slave_api', params=payload)
print(response)
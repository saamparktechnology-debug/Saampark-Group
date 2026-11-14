import socket

def check_port(port):
    s = socket.socket()
    s.settimeout(2)
    try:
        s.connect(("127.0.0.1", port))
        s.close()
        return True
    except:
        return False

print("Port 3000 (frontend) listening:", check_port(3000))
print("Port 5000 (backend) listening:", check_port(5000))

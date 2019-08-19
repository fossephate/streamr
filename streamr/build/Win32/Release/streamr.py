# win32
import msvcrt
import win32api
import win32con
import win32com
import win32com.client
import win32gui
import win32ui

# socketio
from socketIO_client_nexus import SocketIO, LoggingNamespace, BaseNamespace
import logging
from threading import Thread

# pillow
import PIL
from PIL import Image, ImageDraw, ImageFont
from PIL import ImageGrab

# image utils
import base64
from io import StringIO
from io import BytesIO

# misc
from time import sleep

# multi monitor fix
from grabscreen import *


class Client(object):

	def __init__(self):
		self.socketio = SocketIO("http://twitchplaysnintendoswitch.com:8110")

		self.socketio = SocketIO("localhost:8001")
		self.socketio.on("ss3", self.getScreenshot)

		self.receive_events_thread = Thread(target=self._receive_events_thread)
		self.receive_events_thread.daemon = True
		self.receive_events_thread.start()

	def _receive_events_thread(self):
		self.socketio.wait()

	def getScreenshot(*args):

		x1 = 319 - 1920
		y1 = 61 + 360
		x2 = 319 + 1280 - 1920
		y2 = 61 + 720 + 360

		# capture screenshot
		# screenshot = PIL.ImageGrab.grab([x1, y1, x2, y2]).convert("RGBA")
		# screenshot = grab_screen([x1, y1, x2, y2]).convert("RGBA")
		# screenshot = grab_screen([0, 0, 1920, 1080]).convert("RGBA")
		# screenshot.show()


		hwin = win32gui.GetDesktopWindow()

		# width = win32api.GetSystemMetrics(win32con.SM_CXVIRTUALSCREEN)
		# height = win32api.GetSystemMetrics(win32con.SM_CYVIRTUALSCREEN)
		# left = win32api.GetSystemMetrics(win32con.SM_XVIRTUALSCREEN)
		# top = win32api.GetSystemMetrics(win32con.SM_YVIRTUALSCREEN)
		# print(width, height, left, top)

		width = 1280
		height = 720
		left = x1
		top = y1

		hwindc = win32gui.GetWindowDC(hwin)
		srcdc = win32ui.CreateDCFromHandle(hwindc)
		memdc = srcdc.CreateCompatibleDC()
		bmp = win32ui.CreateBitmap()
		bmp.CreateCompatibleBitmap(srcdc, width, height)
		memdc.SelectObject(bmp)
		memdc.BitBlt((0, 0), (width, height), srcdc, (left, top), win32con.SRCCOPY)

		# https://github.com/python-pillow/Pillow/issues/1547
		# https://stackoverflow.com/questions/6951557/pil-and-bitmap-from-winapi
		# https://stackoverflow.com/questions/4589206/python-windows-7-screenshot-without-pil/4589290#4589290

		bmpinfo = bmp.GetInfo()
		bmpstr = bmp.GetBitmapBits(True)
		im = Image.frombuffer(
			"RGB",
			(bmpinfo['bmWidth'], bmpinfo["bmHeight"]),
			bmpstr, "raw", "BGRX", 0, 1)

		# im.show()

		# convert image to base64 string
		buffer = BytesIO()
		scale = 30/100
		size = 1280*scale, 720*scale
		im.thumbnail(size)
		im.save(buffer, format="JPEG", quality=10)#30

		img_str = str(base64.b64encode(buffer.getvalue()).decode())
		client.socketio.emit("screenshot", img_str);

		return



client = Client()
while True:
	# so I don't get stuck:
	if(win32api.GetAsyncKeyState(win32con.VK_ESCAPE)):
		exit()
	sleep(0.1)
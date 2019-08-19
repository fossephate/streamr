
#define _CRT_SECURE_NO_WARNINGS
#pragma warning(disable:4996)
#define _WINSOCKAPI_   /* Prevent inclusion of winsock.h in windows.h */

#include <stdio.h>
#include <fstream>
#include <stdlib.h>
#include <iostream>
#include <mutex>
#include <filesystem>
#include <string>
#include <chrono>
#include <thread>
#include <vector>
#include <algorithm>

#include "screen.h"
#include "base64.h"
#include "MouseController.hpp"
#include "KeyboardController.hpp"

#include <gdiplus.h>
#pragma comment(lib, "Gdiplus.lib")




namespace fs = std::experimental::filesystem;

#include "tools.h"// includes windows.h

#if defined(_WIN32)
	#include <Windows.h>
	#include <Lmcons.h>
	#include <shlobj.h>
#endif

#include "sio/sio_client.h"

// websocket:
#include "easywsclient.hpp"
#include "easywsclient.cpp" // <-- include only if you don't want compile separately
#include <WinSock2.h>
#include <assert.h>


std::mutex _lock;

using easywsclient::WebSocket;
static WebSocket::pointer ws = NULL;

void handle_message(const std::string & message)
{
	printf(">>> %s\n", message.c_str());
	//if (message == "world") { ws->close(); }
}


int main(int argc, char *argv[]) {

	// hide console window
	HWND hWnd = GetConsoleWindow();
	//ShowWindow(hWnd, SW_HIDE);
	//SetWindowText(hWnd, "streamr");

	// Initialize GDI+.
	ULONG_PTR m_gdiplusToken;
	Gdiplus::GdiplusStartupInput gdiplusStartupInput;
	Gdiplus::GdiplusStartup(&m_gdiplusToken, &gdiplusStartupInput, NULL);


	sio::client myClient;
	// set infinite reconnect attempts
	myClient.set_reconnect_attempts(999999999999);

	//myClient.connect("http://fosse.co:443/socket.io");
	//myClient.connect("http://fosse.co:80/socket.io");
	//myClient.connect("http://fosse.co:80/socket.io"); // what it was
	//myClient.connect("https://fosse.co:80/socket.io"); // works // best
	//myClient.connect("https://fosse.co:80/8100/socket.io");
	//myClient.connect("http://fosse.co/8110");// works

	if (argc > 1) {
		//myClient.connect("https://127.0.0.1:8001/socket.io"); // use the ip address instead of the domain name
		printf(argv[1]);
		printf("\n");
		myClient.connect(argv[1]); // use the ip address instead of the domain name
	} else {
		myClient.connect("https://159.65.235.95:80/socket.io"); // use the ip address instead of the domain name
	}

	// join the lagless5Host room
	//myClient.socket()->emit("join", std::string("lagless5Host"));

	std::string password("garbage");

	sio::message::list list;
	list.push(sio::string_message::create("lagless5Host"));
	list.push(sio::string_message::create(password));
	myClient.socket()->emit("joinSecure", list);

	// screenshot with new new parameters:
	myClient.socket()->on("ss3", sio::socket::event_listener_aux([&](std::string const& name, sio::message::ptr const& data, bool isAck, sio::message::list &ack_resp) {

		printf("recieved ss.\n");

		RECT      rc;
		GetClientRect(GetDesktopWindow(), &rc);

		int x1 = data->get_map()["x1"]->get_int();
		int y1 = data->get_map()["y1"]->get_int();
		int x2 = data->get_map()["x2"]->get_int();
		int y2 = data->get_map()["y2"]->get_int();
		int q = data->get_map()["q"]->get_int();
		int s = data->get_map()["s"]->get_int();

		long width = rc.right;
		long height = rc.bottom;

		POINT a;
		POINT b;

		// incase I want to set the compression level but don't know the width and height:
		if (x1 == -1) {
			width = rc.right;
			height = rc.bottom;

			// for high DPI displays:
			if (width == 1500) {
				width *= 2;
				height *= 2;
			}

			a = { 0, 0 };
			b = { width, height };
		} else {
			a = { x1, y1 };
			b = { x2, y2 };
		}

		//std::string encoded_string = screenshotToBase64Resize(a, b, q, s);
		std::string encoded_string = screenshotToBase64Resize2(a, b, q, s);
		myClient.socket()->emit("screenshot5", encoded_string);
		//ws->send(encoded_string);
	}));

	myClient.socket()->on("quit", sio::socket::event_listener_aux([&](std::string const& name, sio::message::ptr const& data, bool isAck, sio::message::list &ack_resp) {
		exit(0);
	}));


	// Shut Down GDI+
	//Gdiplus::GdiplusShutdown(m_gdiplusToken);


	using namespace std::chrono;
	steady_clock::time_point clock_begin1 = steady_clock::now();
	steady_clock::time_point clock_begin2 = steady_clock::now();

	//while (true) {
	//	Sleep(5000);
	//	steady_clock::time_point clock_end = steady_clock::now();
	//	steady_clock::duration time_span = clock_end - clock_begin1;
	//	double nseconds = double(time_span.count()) * steady_clock::period::num / steady_clock::period::den;
	//	//std::cout << nseconds << " seconds." << std::endl;
	//	if (nseconds > 600) {
	//		exit(0);
	//	}
	//}

	while (true) {
		Sleep(5000);
		steady_clock::time_point clock_end = steady_clock::now();
		steady_clock::duration time_span;
		double nseconds;


		time_span = clock_end - clock_begin2;
		nseconds = double(time_span.count()) * steady_clock::period::num / steady_clock::period::den;
		//std::cout << nseconds << " seconds." << std::endl;
		if (nseconds > 10) {
			// reset the timer:
			clock_begin2 = steady_clock::now();

			sio::message::list list;
			list.push(sio::string_message::create("lagless5Host"));
			list.push(sio::string_message::create(password));
			myClient.socket()->emit("joinSecure", list);

		}
		
		time_span = clock_end - clock_begin1;
		nseconds = double(time_span.count()) * steady_clock::period::num / steady_clock::period::den;
		//std::cout << nseconds << " seconds." << std::endl;
		if (nseconds > 300) {
			exit(0);
		}
	}



	//INT rc;
	//WSADATA wsaData;

	//rc = WSAStartup(MAKEWORD(2, 2), &wsaData);
	//if (rc) {
	//	printf("WSAStartup Failed.\n");
	//	return 1;
	//}

	//ws = WebSocket::from_url("ws://127.0.0.1:8006/video");
	//assert(ws);
	//ws->send("goodbye");
	//ws->send("hello");
	//while (ws->getReadyState() != WebSocket::CLOSED) {
	//	ws->poll();
	//	ws->dispatch(handle_message);
	//}

	//delete ws;
	//WSACleanup();



	// why is this necessary??
	int x;
	std::cin >> x;

	return 0;
}
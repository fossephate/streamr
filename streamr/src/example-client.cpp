#define _CRT_SECURE_NO_WARNINGS
#pragma warning(disable:4996)
#include "easywsclient.hpp"
#include "easywsclient.cpp" // <-- include only if you don't want compile separately
#ifdef _WIN32
#pragma comment( lib, "ws2_32" )
#include <WinSock2.h>
#endif
#include <assert.h>
#include <stdio.h>
#include <string>

using easywsclient::WebSocket;
static WebSocket::pointer ws = NULL;

void handle_message(const std::string & message)
{
    printf(">>> %s\n", message.c_str());
    if (message == "world") { ws->close(); }
}

int main()
{
    INT rc;
    WSADATA wsaData;

    rc = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (rc) {
        printf("WSAStartup Failed.\n");
        return 1;
    }

    ws = WebSocket::from_url("ws://127.0.0.1:8011/video");
    assert(ws);
    ws->send("goodbye");
    ws->send("hello");
    while (ws->getReadyState() != WebSocket::CLOSED) {
      ws->poll();
      ws->dispatch(handle_message);
    }
    delete ws;
    WSACleanup();
    return 0;
}

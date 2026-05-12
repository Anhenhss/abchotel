import { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

export const useSignalR = (onReceiveNotification) => {
  const [connection, setConnection] = useState(null);
  const callbackRef = useRef(onReceiveNotification);

  useEffect(() => {
    callbackRef.current = onReceiveNotification;
  }, [onReceiveNotification]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const options = {
      skipNegotiation: true,
      transport: signalR.HttpTransportType.WebSockets
    };

    // Nếu có token thì gửi để xác thực Admin, không có vẫn cho Khách kết nối
    if (token) {
      options.accessTokenFactory = () => token;
    }

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5035/notificationHub', options)
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    return () => {
      if (newConnection) {
        newConnection.stop().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (connection && connection.state === signalR.HubConnectionState.Disconnected) {
      connection.start()
        .then(() => {
          console.log('✅ SignalR: Connected!');
          connection.on('ReceiveNotification', (data) => {
            if (callbackRef.current) callbackRef.current(data);
          });
        })
        .catch(err => {
          if (err.name !== 'AbortError') console.error('❌ SignalR Error:', err);
        });
    }
  }, [connection]);

  return connection;
};
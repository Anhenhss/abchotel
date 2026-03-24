import { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

export const useSignalR = (onReceiveNotification) => {
  const [connection, setConnection] = useState(null);
  const callbackRef = useRef(onReceiveNotification);

  // Cập nhật callback mới nhất mà không gây re-render
  useEffect(() => {
    callbackRef.current = onReceiveNotification;
  }, [onReceiveNotification]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5035/notificationHub', {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    // Dọn dẹp kết nối cũ nếu Component bị hủy
    return () => {
      newConnection.stop();
    };
  }, []);

  useEffect(() => {
    if (connection) {
      // Chỉ bắt đầu kết nối khi nó đang ở trạng thái Ngắt kết nối
      if (connection.state === signalR.HubConnectionState.Disconnected) {
        connection.start()
          .then(() => {
            console.log('Đã kết nối SignalR thành công!');
            connection.on('ReceiveNotification', (notification) => {
              if (callbackRef.current) callbackRef.current(notification);
            });
          })
          .catch(e => console.log('Lỗi kết nối SignalR: ', e));
      }
    }
  }, [connection]);
};
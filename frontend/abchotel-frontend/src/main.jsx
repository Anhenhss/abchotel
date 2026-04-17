import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Thêm dòng này để định nghĩa Router
import App from './App.jsx';
import './index.css'; // Đảm bảo có file này để nhận các style cơ bản

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BrowserRouter phải bao quanh App để các đường dẫn /profile hoạt động */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
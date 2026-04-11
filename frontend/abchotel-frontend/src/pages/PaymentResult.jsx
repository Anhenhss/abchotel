import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Card, Spin } from 'antd';
import axiosClient from '../api/axiosClient';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); 
  const [message, setMessage] = useState('Đang xử lý kết quả từ ngân hàng...');

  useEffect(() => {
    // Lấy nguyên bộ tham số trên URL mà VNPay ném về
    const queryString = searchParams.toString();
    
    // Gửi bộ tham số đó lên API C# để nó kiểm tra chữ ký
    axiosClient.get(`/Invoices/vnpay-return?${queryString}`)
      .then(res => {
        setStatus('success');
        setMessage(res.message || 'Giao dịch thành công!');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Giao dịch thất bại hoặc bị hủy.');
      });
  }, [searchParams]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Card style={{ width: 500, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        {status === 'processing' ? (
           <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /><p style={{ marginTop: 20 }}>{message}</p></div>
        ) : (
          <Result
            status={status}
            title={status === 'success' ? 'Thanh toán Thành công!' : 'Thanh toán Thất bại'}
            subTitle={message}
            extra={[
              <Button type="primary" key="console" onClick={() => navigate('/admin/invoices')}>
                Quay lại Danh sách Hóa đơn
              </Button>
            ]}
          />
        )}
      </Card>
    </div>
  );
}
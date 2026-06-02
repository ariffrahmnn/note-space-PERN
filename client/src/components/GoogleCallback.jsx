import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('token', token);
      window.location.replace('/');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return <div className="flex justify-center items-center h-screen">Sedang memproses login...</div>;
};

export default GoogleCallback;
import axios from 'axios';

export const submitReceipt = (formData) =>
  axios.post('http://127.0.0.1:8001/api/receipts/submit', formData);

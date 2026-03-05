
export default async function handler(req, res) {
  const apiRes = await fetch('http://api-service:8000/api/risks');
  const data = await apiRes.json();
  res.status(200).json(data);
}

export default async function handler(req, res) {
  try {
    const response = await fetch('http://api-service:8001/api/graph');
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error('Graph API error:', err);
    res.status(200).json({ nodes: [], edges: [] });
  }
}

import { jwtVerify } from 'jose';

export async function authenticateRequest(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error("Unauthorized - Missing token");
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'secret');
    const { payload } = await jwtVerify(token, secret);
    decoded = payload;
  } catch (error) {
    throw new Error("Unauthorized - Invalid token");
  }

  const userId = decoded.userId;
  if (!userId) {
    throw new Error("Unauthorized - Invalid token payload");
  }

  return userId;
}

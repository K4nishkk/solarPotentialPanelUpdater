export const dynamic = 'force-dynamic'; // static by default, unless reading the request
 
export function GET(request) {
    console.log("new function ran")
  return new Response(`Hello from ${process.env.VERCEL_REGION}`);
}
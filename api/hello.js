export const dynamic = 'force-dynamic'; // static by default, unless reading the request
 
export function GET(request) {
    setInterval(() => {
        console.log("something");
    }, 1000); // 1000 milliseconds = 1 second
}
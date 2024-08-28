import './global.css'

export const metadata = {
  title: "Solar Potential App",
  description: "Major Project",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

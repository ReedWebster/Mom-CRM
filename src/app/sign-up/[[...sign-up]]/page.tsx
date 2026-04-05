import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#FAF7F2",
    }}>
      <SignUp />
    </div>
  );
}

import { Body, Button, Container, Head, Html, Text } from "@react-email/components";

type WelcomeEmailProps = {
  userName: string;
};

export function WelcomeEmail({ userName }: WelcomeEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://你的域名.com";

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif" }}>
        <Container>
          <Text>Hi {userName}, welcome to Paper Plane!</Text>
          <Text>Your account is ready. Start your first work now.</Text>
          <Button href={appUrl}>Start working</Button>
        </Container>
      </Body>
    </Html>
  );
}

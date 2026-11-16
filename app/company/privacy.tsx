import { CompanyLine, CompanyScreen } from "../../components/company/CompanyScreen";

export default function PrivacyScreen() {
  return (
    <CompanyScreen title="Privacy policy" icon="shield-checkmark" color="#15803D" background="#DCFCE7">
      <CompanyLine icon="phone-portrait" color="#0B2A5B" background="#E0E7FF" text="Your sign-in and language stay on this phone." />
      <CompanyLine icon="document-text" color="#0369A1" background="#E0F2FE" text="Invoices you create stay on this phone." />
      <CompanyLine icon="egg" color="#B45309" background="#FEF3C7" text="Farm records and market rates stay on your account." />
      <CompanyLine icon="lock-closed" color="#15803D" background="#DCFCE7" text="We do not sell your information." />
    </CompanyScreen>
  );
}

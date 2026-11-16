import { CompanyLine, CompanyScreen } from "../../components/company/CompanyScreen";

export default function OfficeScreen() {
  return (
    <CompanyScreen title="Office address" icon="business" color="#7E22CE" background="#F3E8FF">
      <CompanyLine icon="business" color="#7E22CE" background="#F3E8FF" text="Poultech Solutions Pvt. Ltd." />
      <CompanyLine icon="location" color="#B45309" background="#FEF3C7" text="Pune, Maharashtra" />
      <CompanyLine icon="map" color="#0369A1" background="#E0F2FE" text="A full street address will be shown here when the company publishes it." />
    </CompanyScreen>
  );
}

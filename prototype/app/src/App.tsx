import { useMemo } from "react";
import { chooseLink } from "./doll/chooseLink";
import { PhoneApp } from "./app/PhoneApp";
import { DemoPage } from "./demo/DemoPage";

export function App() {
  const choice = useMemo(chooseLink, []);
  if (choice.kind === "simulated") return <DemoPage link={choice.link} doll={choice.doll} />;
  return <div className="solo"><PhoneApp link={choice.link} simulated={false} /></div>;
}

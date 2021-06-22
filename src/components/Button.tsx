/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable react/react-in-jsx-scope */
import { useState } from "react";

export function Button() {
  //let counter = 0
  const [counter, setCounter] = useState(0);

  function increment() {
    setCounter(counter + 1);
    console.log(counter);
  }

  return (
    <button onClick={increment}>
      {counter}
    </button>
  );
}
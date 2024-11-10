export interface Example {
  title: string;
  language: 'javascript' | 'typescript';
  code: string;
}

const examples: Example[] = [
    {
      title: 'Hello World',
      language: 'javascript',
      code: `console.log('Hello, World!');`,
    },
    {
      title: 'Factorial Function',
      language: 'javascript',
      code: `function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
console.log(factorial(5)); // Output: 120
  `,
    },
    {
      title: 'Multiply Two Numbers',
      language: 'typescript',
      code: `console.log(2 * 2);`,
    },
    {
      title: 'Interface Example',
      language: 'typescript',
      code: `interface Person {
  name: string;
  age: number;
}
  
const person: Person = {
  name: 'Alice',
  age: 30,
};
  
console.log(person);
  `,
    },
  ];

export default examples  
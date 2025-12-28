
export const numberEnumToArray = (numberEnum: { [key: string]: string | boolean }) => {
  return Object.values(numberEnum).filter((value) => typeof value === 'number') as number[]
}
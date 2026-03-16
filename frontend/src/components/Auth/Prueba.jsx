import { Button } from "@/components/ui/button"
import { Input }  from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Prueba() {
  return (
    <Card className="w-96 mx-auto mt-10">
      <CardHeader>
        <CardTitle>☕ CoffePrice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Correo electrónico" />
        <Button className="w-full">Entrar</Button>
      </CardContent>
    </Card>
  )
}
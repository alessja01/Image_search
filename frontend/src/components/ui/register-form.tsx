import { GalleryVerticalEnd } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toaster } from "react-hot-toast"
import { DatePicker } from "@/components/ui/date-picker"

export function RegisterForm({
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  selectedDate,
  setSelectedDate,
  handleRegister,
  className,
  ...props
}: {
  username: string
  setUsername: (val: string) => void
  email: string
  setEmail: (val: string) => void
  password: string
  setPassword: (val: string) => void
  selectedDate: Date | undefined
  setSelectedDate: (val: Date) => void
  handleRegister: () => void
} & React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("flex justify-center flex-col gap-6", className)} {...props}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleRegister()
        }}
      >
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-2">
            <a href="#" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex h-8 w-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">DB Vector</span>
            </a>
            <h1 className="text-xl font-bold">Welcome</h1>
            <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
              Hai già un account?{" "}
              <a href="/login" className="underline underline-offset-4 text-blue-500 hover:text-blue-700">
                Log in
              </a>
            </div>
          </div>

          {/* Campi del form */}
          <div className="flex flex-col gap-6">
            {/* Username */}
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="nomecognome"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Data di nascita */}
            <div className="grid gap-2">
              <Label htmlFor="dob">Data di nascita</Label>
              <DatePicker
                startYear={1900}
                endYear={new Date().getFullYear()}
                selectedDate={selectedDate}
                onChange={(date) => {
                  const today = new Date()
                  const minAgeDate = new Date()
                  minAgeDate.setFullYear(today.getFullYear() - 10)

                  if (date > minAgeDate) {
                    alert("Devi avere almeno 10 anni.")
                    return
                  }

                  setSelectedDate(date)
                }}
              />
            </div>

            {/* Submit */}
            <Toaster position="top-right" />
            <Button type="submit">Register</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
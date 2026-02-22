"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Role = "夫" | "妻"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<Role>("夫")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!email || !email.includes("@")) {
        setError("有効なメールアドレスを入力してください")
        return
      }
      if (password.length < 6) {
        setError("パスワードは6文字以上で入力してください")
        return
      }

      if (isSignUp) {
        if (!name.trim()) {
          setError("名前を入力してください")
          return
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
              `${window.location.origin}/`,
            data: {
              name: name.trim(),
              role,
            },
          },
        })

        if (signUpError) {
          setError(signUpError.message)
          return
        }

        setSignUpSuccess(true)
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setError(
            signInError.message === "Invalid login credentials"
              ? "メールアドレスまたはパスワードが正しくありません"
              : signInError.message
          )
          return
        }

        router.push("/")
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  if (signUpSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
              K
            </div>
            <h1 className="text-2xl font-bold text-foreground text-balance">カジシフト</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">確認メールを送信しました</CardTitle>
              <CardDescription>
                {email} に確認メールを送信しました。メール内のリンクをクリックしてアカウントを有効化してください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSignUpSuccess(false)
                  setIsSignUp(false)
                }}
              >
                ログイン画面に戻る
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
            K
          </div>
          <h1 className="text-2xl font-bold text-foreground text-balance">カジシフト</h1>
          <p className="mt-1 text-sm text-muted-foreground">シフト連動 家庭タスク管理</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {isSignUp ? "新規登録" : "ログイン"}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? "アカウントを作成してはじめましょう"
                : "メールアドレスとパスワードでログイン"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {isSignUp && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">名前</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="例: 太郎"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="role">役割</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="夫">夫</SelectItem>
                        <SelectItem value="妻">妻</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="6文字以上"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading
                  ? "処理中..."
                  : isSignUp
                    ? "新規登録"
                    : "ログイン"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError("")
                  }}
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline hover:text-foreground transition-colors"
                >
                  {isSignUp
                    ? "既にアカウントをお持ちの方はこちら"
                    : "アカウントをお持ちでない方はこちら"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

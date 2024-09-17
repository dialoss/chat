'use client'

import { useState } from 'react'
import { Button, Input } from "@nextui-org/react"
import { signIn } from "next-auth/react"
import { useLoading } from "@/lib/hooks"
import { callApi } from "@/app/utils/api"
import { useForm, SubmitHandler } from "react-hook-form"

interface IFormInputs {
  name: string
  email: string
  password: string
}

export default function RegisterForm() {
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm<IFormInputs>()

  const onSubmit: SubmitHandler<IFormInputs> = async (data) => {
    setError('')
    try {
      await callApi('/api/register', {
        method: 'POST',
        body: data
      })
      await signIn('credentials', { email: data.email, password: data.password, callbackUrl: '/' })
    } catch (error) {
      setError(error.message)
      console.error('Registration error:', error)
    }
  }

  const { isLoading, call } = useLoading(() => handleSubmit(onSubmit)())

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Name"
          {...register("name", { required: "Name is required" })}
          isInvalid={!!errors.name}
          errorMessage={errors.name?.message}
        />
        <Input
          label="Email"
          type="email"
          {...register("email", { 
            required: "Email is required",
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: "Invalid email address"
            }
          })}
          isInvalid={!!errors.email}
          errorMessage={errors.email?.message}
        />
        <Input
          label="Password"
          type="password"
          {...register("password", { 
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters"
            }
          })}
          isInvalid={!!errors.password}
          errorMessage={errors.password?.message}
        />
        {error && <p className="text-red-500">{error}</p>}
        <Button type="submit" color="primary" isLoading={isLoading} onClick={call}>Register</Button>
      </form>
    </div>
  )
}
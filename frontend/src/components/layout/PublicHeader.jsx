import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/button'

const PublicHeader = () => {
    const { user } = useAuth()

    return (
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to={user ? "/dashboard" : "/"} className="flex items-center">
                        <img src="/stockwise black.webp" alt="Stockwise Logo" className="h-10 w-auto" />
                    </Link>
                    <div className="flex items-center space-x-4">
                        <Link to="/auth">
                            <Button size="sm">Get Started Free</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default PublicHeader

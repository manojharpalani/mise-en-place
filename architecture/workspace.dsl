workspace "Mise en Place (With Metta)" "Local community commerce platform connecting home chefs, meal planners, and buyers." {

    !identifiers hierarchical

    model {
        buyer            = person "Buyer" "Discovers sellers, orders meals, manages subscriptions."
        seller           = person "Seller" "Licensed home chef running a branded storefront."
        employee         = person "Seller Employee" "Staff member with limited access to a seller's operations."
        planner          = person "Meal Planner" "Builds weekly meal plans and an optional public profile."
        admin            = person "Admin" "Approves sellers, moderates content, reviews platform metrics."

        stripe    = softwareSystem "Stripe" "Payment processing, checkout, and payout webhooks." "External"
        twilio    = softwareSystem "Twilio" "SMS / WhatsApp delivery for OTP login and order notifications." "External"
        sendgrid  = softwareSystem "SendGrid" "Transactional email delivery." "External"
        s3        = softwareSystem "AWS S3" "Object storage for menu photos, flyers, and uploads." "External"
        anthropic = softwareSystem "Anthropic Claude" "AI menu suggestions, dish inspiration, and content generation." "External"
        openai    = softwareSystem "OpenAI" "AI-assisted content and image generation." "External"
        vercel    = softwareSystem "Vercel" "Hosting, cron scheduling, and OG image generation." "External"

        miseEnPlace = softwareSystem "Mise en Place" "Storefronts, meal planning, ordering, and marketplace operations." {

            webApp = container "Web Application" "Server-rendered pages and client UI for buyers, sellers, planners, and admins." "Next.js 16 (App Router), React 19, Tailwind CSS" "WebApp"

            middleware = container "Auth Middleware" "Route-level session and role checks (seller/buyer/admin) before pages render." "Next.js proxy.ts + NextAuth JWT"

            api = container "API Layer" "REST endpoints for auth, catalog, orders, subscriptions, marketing, and AI features." "Next.js Route Handlers (src/app/api/**)" "API"

            auth = container "Auth Service" "Credential + OTP sign-in, session issuance, role-based access control." "NextAuth v5 + Prisma Adapter"

            cron = container "Scheduled Jobs" "Daily menu publication and recurring subscription processing." "Vercel Cron -> /api/cron/daily-menu"

            database = container "Database" "Users, seller profiles, menus, orders, subscriptions, planner data, reviews." "PostgreSQL via Prisma ORM" "Database"

            # relationships: people -> containers
            buyer -> webApp "Browses storefronts, places orders, manages subscriptions" "HTTPS"
            seller -> webApp "Manages menu, orders, marketing, employees" "HTTPS"
            employee -> webApp "Operates seller dashboard within granted permissions" "HTTPS"
            planner -> webApp "Builds weekly plans, manages public profile" "HTTPS"
            admin -> webApp "Approves sellers, moderates content, views metrics" "HTTPS"

            # relationships: internal containers
            webApp -> middleware "Every request to /seller, /buyer, /admin" "Next.js middleware"
            middleware -> auth "Validates session token"
            webApp -> api "Calls for data + mutations" "fetch / JSON"
            api -> auth "Authenticates and authorizes requests"
            api -> database "Reads and writes" "Prisma Client / SQL"
            auth -> database "Reads users, sessions, accounts" "Prisma Client"
            cron -> api "Triggers daily menu publish" "HTTPS"
            cron -> database "Reads/updates weekly menus" "Prisma Client"

            # relationships: containers -> external systems
            api -> stripe "Creates checkout sessions, receives payment webhooks" "HTTPS/REST"
            api -> twilio "Sends OTP codes and order SMS/WhatsApp messages" "HTTPS/REST"
            api -> sendgrid "Sends transactional email" "HTTPS/REST"
            api -> s3 "Uploads and signs URLs for images/flyers" "HTTPS/REST"
            api -> anthropic "Requests AI menu suggestions and content" "HTTPS/REST"
            api -> openai "Requests AI-assisted content/image generation" "HTTPS/REST"
            webApp -> vercel "Generates OG social preview images" "HTTPS"
            stripe -> api "Payment + payout event webhooks" "HTTPS/REST"
        }
    }

    views {
        systemContext miseEnPlace "SystemContext" {
            include *
            autoLayout lr
            description "People and external systems around the Mise en Place platform."
        }

        container miseEnPlace "Containers" {
            include *
            autoLayout lr
            description "Containers that make up the Mise en Place platform."
        }

        styles {
            element "Person" {
                shape person
                background #2f6f4f
                color #ffffff
            }
            element "Software System" {
                background #1c4532
                color #ffffff
            }
            element "External" {
                background #8c8c8c
                color #ffffff
            }
            element "Container" {
                background #2f855a
                color #ffffff
            }
            element "WebApp" {
                background #276749
                color #ffffff
            }
            element "API" {
                background #38a169
                color #ffffff
            }
            element "Database" {
                shape cylinder
                background #22543d
                color #ffffff
            }
        }
    }
}

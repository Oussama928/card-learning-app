export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Card Learning API",
    version: "1.0.0",
    description: "API documentation for the Card Learning app",
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "Auth" },
    { name: "Cards" },
    { name: "Stats" },
    { name: "Search" },
    { name: "Notifications" },
    { name: "Achievements" },
    { name: "StudyGroups" },
    { name: "UserPreferences" },
    { name: "Uploads" },
    { name: "Health" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ApiErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
          details: { type: "string" },
        },
        required: ["error"],
      },
      ApiSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          total: { type: "integer", example: 120 },
          totalPages: { type: "integer", example: 6 },
        },
        required: ["page", "limit", "total", "totalPages"],
      },
      CardOwner: {
        type: "object",
        properties: {
          id: { type: "integer" },
          username: { type: "string" },
          email: { type: "string" },
          image: { type: "string", nullable: true },
        },
      },
      Card: {
        type: "object",
        properties: {
          id: { type: "integer" },
          title: { type: "string" },
          description: { type: "string" },
          target_language: { type: "string" },
          user_id: { type: "integer" },
          total_words: { type: "integer" },
          owner: { $ref: "#/components/schemas/CardOwner" },
        },
      },
      AddCardRequest: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 100 },
          targetLanguage: { type: "string", minLength: 1, maxLength: 50 },
          description: { type: "string", minLength: 1, maxLength: 500 },
          words: {
            type: "array",
            items: { type: "array", items: [{ type: "string" }, { type: "string" }] },
          },
          fileContent: { type: "string" },
          edit: { type: "boolean" },
          id: { type: "integer" },
        },
        required: ["title", "targetLanguage", "description"],
      },
      AddCardResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          cardId: { type: "integer" },
        },
      },
      TierDefinition: {
        type: "object",
        properties: {
          name: { type: "string" },
          thresholdXp: { type: "integer" },
          imageUrl: { type: "string" },
        },
      },
      UserTierProgress: {
        type: "object",
        properties: {
          currentTier: { $ref: "#/components/schemas/TierDefinition" },
          currentXp: { type: "number" },
          percentileRanking: { type: "number" },
          nextUnlock: {
            type: "object",
            nullable: true,
            properties: {
              tier: { $ref: "#/components/schemas/TierDefinition" },
              xpRemaining: { type: "integer" },
            },
          },
        },
      },
      AchievementBadge: {
        type: "object",
        properties: {
          key: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          imageUrl: { type: "string", nullable: true },
          unlocked: { type: "boolean" },
          unlockedAt: { type: "string", format: "date-time", nullable: true },
          progress: { type: "integer" },
          target: { type: "integer" },
        },
      },
      UploadResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              url: { type: "string" },
              filename: { type: "string" },
              mimetype: { type: "string" },
              size: { type: "integer" },
            },
          },
        },
      },
      StudyGroup: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          role: { type: "string", enum: ["teacher", "student"] },
          visibility: { type: "string", enum: ["public", "private"] },
          joinCode: { type: "string", nullable: true },
          memberCount: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      UserPreferences: {
        type: "object",
        properties: {
          emailNotifications: { type: "boolean" },
          pushNotifications: { type: "boolean" },
          studyReminders: { type: "boolean" },
          theme: { type: "string", enum: ["light", "dark", "system"] },
        },
      },
      UpdateProgressRequest: {
        type: "object",
        properties: {
          word_id: { type: "integer" },
          is_learned: { type: "boolean" },
        },
        required: ["word_id", "is_learned"],
      },
      UpdateStreakResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          streak: { type: "integer" },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
        },
        required: ["email"],
      },
      ResendOtpRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
        },
        required: ["email"],
      },
      VerifyOtpRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          otp: { type: "string", minLength: 4, maxLength: 8 },
        },
        required: ["email", "otp"],
      },
      ResetPasswordRequest: {
        type: "object",
        properties: {
          token: { type: "string" },
          password: { type: "string", minLength: 6 },
        },
        required: ["token", "password"],
      },
      RegisterRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          username: { type: "string", minLength: 3, maxLength: 50 },
        },
        required: ["email", "username"],
      },
      PushSubscription: {
        type: "object",
        properties: {
          endpoint: { type: "string" },
          keys: {
            type: "object",
            properties: {
              p256dh: { type: "string" },
              auth: { type: "string" },
            },
            required: ["p256dh", "auth"],
          },
        },
        required: ["endpoint", "keys"],
      },
      PushSendRequest: {
        type: "object",
        properties: {
          title: { type: "string" },
          body: { type: "string" },
          userId: { type: "integer" },
          url: { type: "string" },
        },
      },
      HandleFavoritesRequest: {
        type: "object",
        properties: {
          card_id: { type: "integer" },
          intent: { type: "string", enum: ["add", "remove"] },
        },
        required: ["card_id", "intent"],
      },
      FavoritesResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          favorites: { type: "array", items: { type: "string" } },
          fullFavorites: { type: "array", items: { $ref: "#/components/schemas/Card" } },
        },
      },
      UpdateProfileRequest: {
        type: "object",
        properties: {
          field: { type: "string", enum: ["bio", "country", "username"] },
          value: { type: "string" },
        },
        required: ["field", "value"],
      },
      SearchResponse: {
        type: "object",
        properties: {
          results: {
            type: "array",
            items: { $ref: "#/components/schemas/Card" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },
      HomeOverview: {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["continue", "retry", "empty"] },
          unfinishedSessions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                title: { type: "string" },
                description: { type: "string", nullable: true },
                totalWords: { type: "integer" },
                learnedWords: { type: "integer" },
                lastReviewedAt: { type: "string", format: "date-time" },
              },
            },
          },
          completedSessions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                title: { type: "string" },
                description: { type: "string", nullable: true },
                totalWords: { type: "integer" },
                learnedWords: { type: "integer" },
                lastReviewedAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
      StatsResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          stats: {
            type: "object",
            properties: {
              username: { type: "string" },
              email: { type: "string" },
              image: { type: "string", nullable: true },
              country: { type: "string", nullable: true },
              totalWords: { type: "integer" },
              learnedWords: { type: "integer" },
              accuracy: { type: "number" },
              xp: { type: "number" },
              dailyStreak: { type: "integer" },
              lastLoginDate: { type: "string", nullable: true },
              progression: { $ref: "#/components/schemas/UserTierProgress" },
              achievements: {
                type: "array",
                items: { $ref: "#/components/schemas/AchievementBadge" },
              },
              activityHeatmap: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    date: { type: "string", format: "date" },
                    reviews: { type: "integer" },
                    correctReviews: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      GlobalStatsResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          topXpResult: {
            type: "array",
            items: {
              type: "object",
              properties: {
                username: { type: "string" },
                id: { type: "integer" },
                xp: { type: "number" },
                image: { type: "string", nullable: true },
              },
            },
          },
        },
      },
      NotificationCreateRequest: {
        type: "object",
        properties: {
          type: { type: "string" },
          content: { type: "string" },
        },
        required: ["type", "content"],
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string" },
          uptimeSeconds: { type: "integer" },
          timestamp: { type: "string" },
          environment: { type: "string" },
          db: { type: "boolean" },
          cache: { type: "boolean" },
          responseTimeMs: { type: "integer" },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } } },
          "503": { description: "Degraded", content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } } },
        },
      },
    },
    "/api/home/overview": {
      get: {
        tags: ["Home"],
        summary: "Dashboard overview info",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: "#/components/schemas/HomeOverview" } } }
          },
          "401": { description: "Unauthorized" }
        }
      }
    },
    "/api/getGlobalStats": {
      get: {
        tags: ["Stats"],
        summary: "Get global leaderboard stats",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/GlobalStatsResponse" } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/getStats/{id}": {
      get: {
        tags: ["Stats"],
        summary: "Get user stats",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/StatsResponse" } } } },
          "404": { description: "Not found" },
        },
      },
    },
    "/api/getCards/type/{type}": {
      get: {
        tags: ["Cards"],
        summary: "Get cards by type",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "type", in: "path", required: true, schema: { type: "string", enum: ["community", "official"] } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50 } },
        ],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { cards: { type: "array", items: { $ref: "#/components/schemas/Card" } }, pagination: { $ref: "#/components/schemas/Pagination" } } } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/search": {
      get: {
        tags: ["Search"],
        summary: "Search cards",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "searchQuery", in: "query", required: true, schema: { type: "string", minLength: 1 } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
        ],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/SearchResponse" } } } },
          "400": { description: "Invalid request" },
        },
      },
    },
    "/api/notifications": {
      post: {
        tags: ["Notifications"],
        summary: "Broadcast notification",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/NotificationCreateRequest" } } },
        },
        responses: {
          "200": { description: "OK" },
          "401": { description: "Unauthorized" },
        },
      },
      patch: {
        tags: ["Notifications"],
        summary: "Mark notifications as read",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { notifs: { type: "array", items: { type: "object", properties: { id: { type: "integer" } } } } } } } },
        },
        responses: {
          "200": { description: "OK" },
        },
      },
    },
    "/api/notifications/getBig": {
      get: {
        tags: ["Notifications"],
        summary: "Get paginated notifications",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
        ],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/notifications/getSmall": {
      get: {
        tags: ["Notifications"],
        summary: "Get recent notifications",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/notifications/{id}": {
      delete: {
        tags: ["Notifications"],
        summary: "Delete a notification",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
    },
    "/api/notifications/push-subscription": {
      post: {
        tags: ["Notifications"],
        summary: "Register push subscription",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PushSubscription" } } },
        },
        responses: { "200": { description: "OK" } },
      },
      delete: {
        tags: ["Notifications"],
        summary: "Remove push subscription",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { endpoint: { type: "string" } }, required: ["endpoint"] } } },
        },
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/notifications/push/send": {
      post: {
        tags: ["Notifications"],
        summary: "Send push notifications (admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PushSendRequest" } } },
        },
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/addCard": {
      post: {
        tags: ["Cards"],
        summary: "Create or edit a card",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AddCardRequest" } } },
        },
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/AddCardResponse" } } } },
        },
      },
    },
    "/api/deleteCard/{id}": {
      delete: {
        tags: ["Cards"],
        summary: "Delete a card",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
    },
    "/api/notifications": {
      post: {
        tags: ["Notifications"],
        summary: "Send notification to all users (admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { type: { type: "string" }, content: { type: "string" } }, required: ["type", "content"] } } }
        },
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/notifications/getSmall": {
      get: {
        tags: ["Notifications"],
        summary: "Get compact notifications list",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/notifications/getBig": {
      get: {
        tags: ["Notifications"],
        summary: "Get full notifications list",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/achievements": {
      post: {
        tags: ["Achievements"],
        summary: "Create or award achievement (admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  conditionType: { type: "string" },
                  conditionValue: { type: "integer" },
                  xpReward: { type: "integer" },
                },
                required: ["name", "conditionType", "conditionValue"]
              }
            }
          }
        },
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/study-groups": {
      get: {
        tags: ["StudyGroups"],
        summary: "List user study groups",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { type: "object", properties: { groups: { type: "array", items: { $ref: "#/components/schemas/StudyGroup" } } } } } }
          }
        }
      },
      post: {
        tags: ["StudyGroups"],
        summary: "Create a study group",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, visibility: { type: "string", enum: ["public", "private"] } }, required: ["name"] } } }
        },
        responses: { "201": { description: "Created" } }
      }
    },
    "/api/study-groups/{id}/posts": {
      get: {
        tags: ["StudyGroups"],
        summary: "Get group posts",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" } }
      },
      post: {
        tags: ["StudyGroups"],
        summary: "Create group post",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: { type: "object", properties: { content: { type: "string" }, file: { type: "string", format: "binary" } }, required: ["content"] } } }
        },
        responses: { "201": { description: "Created" } }
      }
    },
    "/api/userPreferences": {
      get: {
        tags: ["UserPreferences"],
        summary: "Get preferences",
        security: [{ bearerAuth: [] }],
        responses: { "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/UserPreferences" } } } } }
      },
      patch: {
        tags: ["UserPreferences"],
        summary: "Update preferences",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UserPreferences" } } }
        },
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/uploads": {
      post: {
        tags: ["Uploads"],
        summary: "Upload image",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } }
        },
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: "#/components/schemas/UploadResponse" } } }
          }
        }
      }
    },
    "/api/postProgress": {
      post: {
        tags: ["Cards"],
        summary: "Update learning progress",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateProgressRequest" } } },
        },
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/updateStreak": {
      patch: {
        tags: ["Stats"],
        summary: "Update daily streak",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateStreakResponse" },
              },
            },
          },
        },
      },
    },
    "/api/getProgress/{id}": {
      get: {
        tags: ["Cards"],
        summary: "Get progress for a card",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "email", in: "query", required: true, schema: { type: "string", format: "email" } },
        ],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
    },
    "/api/getCard/{id}": {
      get: {
        tags: ["Cards"],
        summary: "Get a card with progress",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "user_id", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
    },
    "/api/getCards/id/{id}": {
      get: {
        tags: ["Cards"],
        summary: "Get cards by user",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
    },
    "/api/getFavorites": {
      get: {
        tags: ["Cards"],
        summary: "Get favorite cards",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/FavoritesResponse" } } } } },
      },
    },
    "/api/handleFavorites": {
      post: {
        tags: ["Cards"],
        summary: "Add or remove favorite",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/HandleFavoritesRequest" } } },
        },
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/export": {
      get: {
        tags: ["Cards"],
        summary: "Export user data",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/updateInfos/profile": {
      post: {
        tags: ["Auth"],
        summary: "Update profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateProfileRequest" } } },
        },
        responses: { "200": { description: "OK" }, "400": { description: "Invalid field" } },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ForgotPasswordRequest" } } },
        },
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/auth/resend-otp": {
      post: {
        tags: ["Auth"],
        summary: "Resend verification OTP",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ResendOtpRequest" } } },
        },
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify OTP",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/VerifyOtpRequest" } } },
        },
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ResetPasswordRequest" } } },
        },
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/signup": {
      post: {
        tags: ["Auth"],
        summary: "Signup with profile image",
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: { type: "object", properties: { email: { type: "string", format: "email" }, username: { type: "string" }, password: { type: "string" }, photo: { type: "string", format: "binary" } }, required: ["email", "username", "password"] } } },
        },
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/register": {
      post: {
        tags: ["Auth"],
        summary: "Register user",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
        },
        responses: { "200": { description: "OK" } },
      },
    },
  },
} as const;

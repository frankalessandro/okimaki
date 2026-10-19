
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "audit_log": {
                  Row: {
                    "action": string,"actor": string | null,"at": string,"id": number,"new_data": Json | null,"old_data": Json | null,"row_id": string | null,"table_name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor"?: string | null,"at"?: string,"id"?: never,"new_data"?: Json | null,"old_data"?: Json | null,"row_id"?: string | null,"table_name": string
                  }
                  Update: {
                    "action"?: string,"actor"?: string | null,"at"?: string,"id"?: never,"new_data"?: Json | null,"old_data"?: Json | null,"row_id"?: string | null,"table_name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"customers": {
                  Row: {
                    "created_at": string,"first_name": string,"id": string,"last_name": string,"phone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"first_name": string,"id"?: string,"last_name": string,"phone": string
                  }
                  Update: {
                    "created_at"?: string,"first_name"?: string,"id"?: string,"last_name"?: string,"phone"?: string
                  }
                  Relationships: [
                    
                  ]
                },"payments": {
                  Row: {
                    "amount": number,"id": string,"reference": string | null,"reject_reason": string | null,"reported_at": string,"reservation_id": string,"status": Database["public"]['Enums']["payment_status"],"verified_at": string | null,"verified_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"id"?: string,"reference"?: string | null,"reject_reason"?: string | null,"reported_at"?: string,"reservation_id": string,"status"?: Database["public"]['Enums']["payment_status"],"verified_at"?: string | null,"verified_by"?: string | null
                  }
                  Update: {
                    "amount"?: number,"id"?: string,"reference"?: string | null,"reject_reason"?: string | null,"reported_at"?: string,"reservation_id"?: string,"status"?: Database["public"]['Enums']["payment_status"],"verified_at"?: string | null,"verified_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_reservation_id_fkey"
      columns: ["reservation_id"]
isOneToOne: false
      referencedRelation: "reservations"
      referencedColumns: ["id"]
    }
                  ]
                },"reservations": {
                  Row: {
                    "allergies": string | null,"cancel_reason": string | null,"cancelled_at": string | null,"cancelled_by": string | null,"code": string,"created_at": string,"customer_id": string,"first_name": string,"hold_expires_at": string | null,"id": string,"internal_note": string | null,"is_birthday": boolean,"last_name": string,"party_size": number,"price_per_person": number,"reported_at": string | null,"slot_id": string,"status": Database["public"]['Enums']["reservation_status"],"total": number
                  }
                  ComputedFields: never
                  Insert: {
                    "allergies"?: string | null,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"code"?: string,"created_at"?: string,"customer_id": string,"first_name": string,"hold_expires_at"?: string | null,"id"?: string,"internal_note"?: string | null,"is_birthday"?: boolean,"last_name": string,"party_size": number,"price_per_person": number,"reported_at"?: string | null,"slot_id": string,"status"?: Database["public"]['Enums']["reservation_status"],"total": number
                  }
                  Update: {
                    "allergies"?: string | null,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"code"?: string,"created_at"?: string,"customer_id"?: string,"first_name"?: string,"hold_expires_at"?: string | null,"id"?: string,"internal_note"?: string | null,"is_birthday"?: boolean,"last_name"?: string,"party_size"?: number,"price_per_person"?: number,"reported_at"?: string | null,"slot_id"?: string,"status"?: Database["public"]['Enums']["reservation_status"],"total"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "reservations_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservations_slot_id_fkey"
      columns: ["slot_id"]
isOneToOne: false
      referencedRelation: "service_slots"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservations_slot_id_fkey"
      columns: ["slot_id"]
isOneToOne: false
      referencedRelation: "slot_availability"
      referencedColumns: ["slot_id"]
    }
                  ]
                },"service_slots": {
                  Row: {
                    "capacity": number,"closed": boolean,"id": string,"service_type_id": string,"slot_date": string,"start_time": string
                  }
                  ComputedFields: never
                  Insert: {
                    "capacity": number,"closed"?: boolean,"id"?: string,"service_type_id": string,"slot_date": string,"start_time": string
                  }
                  Update: {
                    "capacity"?: number,"closed"?: boolean,"id"?: string,"service_type_id"?: string,"slot_date"?: string,"start_time"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_slots_service_type_id_fkey"
      columns: ["service_type_id"]
isOneToOne: false
      referencedRelation: "service_types"
      referencedColumns: ["id"]
    }
                  ]
                },"service_types": {
                  Row: {
                    "active": boolean,"capacity": number,"duration_minutes": number,"id": string,"name": string,"price": number,"slot_times": (string)[],"weekdays": (number)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"capacity": number,"duration_minutes": number,"id"?: string,"name": string,"price": number,"slot_times": (string)[],"weekdays"?: (number)[]
                  }
                  Update: {
                    "active"?: boolean,"capacity"?: number,"duration_minutes"?: number,"id"?: string,"name"?: string,"price"?: number,"slot_times"?: (string)[],"weekdays"?: (number)[]
                  }
                  Relationships: [
                    
                  ]
                },"settings": {
                  Row: {
                    "booking_window_days": number,"cancel_hours": number,"cancellation_policy": string,"hold_minutes": number,"id": number,"max_reservations_per_day": number,"min_advance_hours": number,"payment_key": string,"payment_key_holder": string,"qr_path": string | null,"reported_limit_minutes": number,"restaurant_name": string,"terms": string,"whatsapp_number": string,"whatsapp_template": string
                  }
                  ComputedFields: never
                  Insert: {
                    "booking_window_days"?: number,"cancel_hours"?: number,"cancellation_policy"?: string,"hold_minutes"?: number,"id"?: number,"max_reservations_per_day"?: number,"min_advance_hours"?: number,"payment_key"?: string,"payment_key_holder"?: string,"qr_path"?: string | null,"reported_limit_minutes"?: number,"restaurant_name"?: string,"terms"?: string,"whatsapp_number"?: string,"whatsapp_template"?: string
                  }
                  Update: {
                    "booking_window_days"?: number,"cancel_hours"?: number,"cancellation_policy"?: string,"hold_minutes"?: number,"id"?: number,"max_reservations_per_day"?: number,"min_advance_hours"?: number,"payment_key"?: string,"payment_key_holder"?: string,"qr_path"?: string | null,"reported_limit_minutes"?: number,"restaurant_name"?: string,"terms"?: string,"whatsapp_number"?: string,"whatsapp_template"?: string
                  }
                  Relationships: [
                    
                  ]
                },"staff": {
                  Row: {
                    "active": boolean,"full_name": string,"role": Database["public"]['Enums']["staff_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"full_name": string,"role"?: Database["public"]['Enums']["staff_role"],"user_id": string
                  }
                  Update: {
                    "active"?: boolean,"full_name"?: string,"role"?: Database["public"]['Enums']["staff_role"],"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "slot_availability": {
                  Row: {
                    "capacity": number | null,"closed": boolean | null,"remaining": number | null,"service_type_id": string | null,"slot_date": string | null,"slot_id": string | null,"start_time": string | null,"taken": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "service_slots_service_type_id_fkey"
      columns: ["service_type_id"]
isOneToOne: false
      referencedRelation: "service_types"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "cancel_reservation":
{ Args: { "p_reason": string,"p_reservation_id": string }; Returns: Json
                           },
"create_reservation":
{ Args: { "p_allergies"?: string,"p_first_name": string,"p_is_birthday"?: boolean,"p_last_name": string,"p_party_size": number,"p_phone": string,"p_slot_id": string,"p_terms_accepted"?: boolean }; Returns: Json
                           },
"expire_holds":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"fecha_local":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"generate_slots":
{ Args: { "p_days"?: number }; Returns: number
                           },
"get_availability":
{ Args: { "p_from": string,"p_to": string }; Returns: {
              "capacity": number,"duration_minutes": number,"price": number,"remaining": number,"service_name": string,"slot_date": string,"slot_id": string,"start_time": string
            }[]
                           },
"get_my_reservation":
{ Args: { "p_code": string,"p_identifier": string }; Returns: Json
                           },
"get_public_settings":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"has_role":
{ Args: { "min_role": Database["public"]['Enums']["staff_role"] }; Returns: boolean
                           },
"normalizar_celular":
{ Args: { "p": string }; Returns: string
                           },
"reject_payment":
{ Args: { "p_reason": string,"p_reservation_id": string }; Returns: Json
                           },
"report_payment":
{ Args: { "p_code": string }; Returns: Json
                           },
"reservation_payload":
{ Args: { "p_id": string }; Returns: Json
                           },
"verify_payment":
{ Args: { "p_reference": string,"p_reservation_id": string }; Returns: Json
                           }
          }
          Enums: {
            "payment_status": "reported"|"verified"|"rejected","reservation_status": "held"|"payment_reported"|"confirmed"|"attended"|"expired"|"cancelled"|"no_show","staff_role": "host"|"admin"|"owner"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "payment_status": ["reported", "verified", "rejected"],"reservation_status": ["held", "payment_reported", "confirmed", "attended", "expired", "cancelled", "no_show"],"staff_role": ["host", "admin", "owner"]
          }
        }
} as const

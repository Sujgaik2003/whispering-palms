import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/response'
import { getAuthenticatedUser } from '@/lib/auth/get-user'

// DELETE /api/user/profile/palm-images/:id - Delete palm image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    const supabase = await createClient()

    // Next.js 15+ requires awaiting params
    const { id } = await params
    const imageId = id

    // Get the palm image to verify ownership and get storage path
    const { data: palmImage, error: fetchError } = await supabase
      .from('palm_images')
      .select('storage_path')
      .eq('id', imageId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !palmImage) {
      return createErrorResponse('Palm image not found or access denied', 404)
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('palm-images')
      .remove([palmImage.storage_path])

    if (storageError) {
      // Continue with database deletion even if storage deletion fails
      console.error('Storage deletion error:', storageError)
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('palm_images')
      .delete()
      .eq('id', imageId)
      .eq('user_id', user.id)

    if (dbError) {
      return createErrorResponse('Failed to delete palm image', 500)
    }

    return createSuccessResponse({
      message: 'Palm image deleted successfully',
    })
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}

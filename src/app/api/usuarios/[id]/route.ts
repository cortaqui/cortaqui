import { NextResponse } from "next/server";
import { assertHasPermission } from "~/lib/auth";
import { findUsuarioById } from "~/server/db/queries";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await assertHasPermission("usuario:read");
    const user = await findUsuarioById(params.id);
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Erro ao obter usuário" }, { status: 500 });
  }
}

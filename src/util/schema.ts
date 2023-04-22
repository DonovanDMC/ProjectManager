import { type Static, Type } from "@sinclair/typebox";

export const Message = Type.Object({
    channel: Type.String(),
    content: Type.String()
});
export type IMessage = Static<typeof Message>;

export const Emoji = Type.Object({
    id:   Type.String(),
    name: Type.String()
});
export type IEmoji = Static<typeof Emoji>;

export const Role = Type.Object({
    id:    Type.String(),
    code:  Type.String(),
    name:  Type.String(),
    emoji: Type.Union([Type.Null(), Emoji])
});
export type IRole = Static<typeof Role>;

export const Project = Type.Object({
    name:    Type.String(),
    id:      Type.String(),
    message: Type.Union([Type.Null(), Message]),
    roles:   Type.Array(Role)
});
export type IProject = Static<typeof Project>;

export const Projects = Type.Array(Project);
export type IProjects = Static<typeof Projects>;

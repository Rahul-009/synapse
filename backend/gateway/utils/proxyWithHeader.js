import proxy from "express-http-proxy";

// Proxies to a downstream service, forwarding the authenticated user's
// identity as headers so services don't need to verify the JWT themselves.
export const proxyWithHeader = (serviceUrl) =>
  proxy(serviceUrl, {
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      if (srcReq.user) {
        proxyReqOpts.headers["x-user-id"] = srcReq.user.id;
        proxyReqOpts.headers["x-user-email"] = srcReq.user.email;
      }
      return proxyReqOpts;
    },
  });

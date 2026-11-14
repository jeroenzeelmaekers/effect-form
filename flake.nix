{
  description = "Development environment for effect-form";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = { nixpkgs, ... }:
    let
      system = "aarch64-darwin";
      pkgs = import nixpkgs { inherit system; };

      nodeVersion = "26.13.1";
      node = pkgs.nodejs_26.overrideAttrs {
        version = nodeVersion;
        src = pkgs.fetchurl
          {
            url = "https://nodejs.org/dist/v${nodeVersion}/node-v${nodeVersion}.tar.xz";
            hash = "sha256-p/YgT/Y7aizSdNSJAyhau4btU6mQcOUy1ML9eHRX2eY=";
          };
      };
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = [
          node
          pkgs.pnpm
        ];
      };
    };
}
